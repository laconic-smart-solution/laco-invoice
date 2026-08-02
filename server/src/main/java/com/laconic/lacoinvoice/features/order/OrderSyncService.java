package com.laconic.lacoinvoice.features.order;

import java.time.Duration;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderItem;
import com.laconic.lacoinvoice.domain.models.OrderSourceType;
import com.laconic.lacoinvoice.features.order.import_.OrderStatusTextMapper;
import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.repositories.CustomerInfoRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderItemRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.ProductRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.integration.cache.MarketplaceTokenCache;
import com.laconic.lacoinvoice.integration.marketplace.order.MarketplaceFetchedOrder;
import com.laconic.lacoinvoice.integration.marketplace.order.MarketplaceFetchedOrderItem;
import com.laconic.lacoinvoice.integration.marketplace.order.MarketplaceOrderAdapter;
import com.laconic.lacoinvoice.integration.marketplace.order.MarketplaceOrderAdapterRegistry;

@Service
public class OrderSyncService {

	private static final Logger log = LoggerFactory.getLogger(OrderSyncService.class);
	private static final Duration TOKEN_CACHE_TTL = Duration.ofHours(1);

	private final StoreRepository storeRepository;
	private final StoreMarketplaceConnectionRepository connectionRepository;
	private final MarketplaceOrderAdapterRegistry adapterRegistry;
	private final MarketplaceTokenCache tokenCache;
	private final OrderRepository orderRepository;
	private final OrderItemRepository orderItemRepository;
	private final CustomerInfoRepository customerInfoRepository;
	private final ProductRepository productRepository;

	public OrderSyncService(
			StoreRepository storeRepository,
			StoreMarketplaceConnectionRepository connectionRepository,
			MarketplaceOrderAdapterRegistry adapterRegistry,
			MarketplaceTokenCache tokenCache,
			OrderRepository orderRepository,
			OrderItemRepository orderItemRepository,
			CustomerInfoRepository customerInfoRepository,
			ProductRepository productRepository) {
		this.storeRepository = storeRepository;
		this.connectionRepository = connectionRepository;
		this.adapterRegistry = adapterRegistry;
		this.tokenCache = tokenCache;
		this.orderRepository = orderRepository;
		this.orderItemRepository = orderItemRepository;
		this.customerInfoRepository = customerInfoRepository;
		this.productRepository = productRepository;
	}

	@Transactional
	public void ingestOrders(Long storeId) {
		Store store = storeRepository.findById(storeId)
				.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + storeId));

		List<StoreMarketplaceConnection> connections = connectionRepository.findByStore_Id(storeId);
		for (StoreMarketplaceConnection connection : connections) {
			if (connection.getStatus() != MarketplaceConnectionStatus.CONNECTED) {
				continue;
			}
			Marketplace marketplace = connection.getMarketplace();
			if (marketplace == null || !StringUtils.hasText(marketplace.getCode())) {
				continue;
			}
			cacheAccessToken(store, marketplace, connection);
			MarketplaceOrderAdapter adapter = adapterRegistry.resolve(marketplace.getCode());
			List<MarketplaceFetchedOrder> fetched = adapter.fetchOrders(connection);
			for (MarketplaceFetchedOrder payload : fetched) {
				upsertOrder(store, marketplace, payload);
			}
		}
		log.info("Order sync completed for storeId={} connections={}", storeId, connections.size());
	}

	@Transactional
	public void ingestAllActiveStores() {
		storeRepository.findByActiveTrue().forEach(store -> ingestOrders(store.getId()));
	}

	private void cacheAccessToken(Store store, Marketplace marketplace, StoreMarketplaceConnection connection) {
		if (StringUtils.hasText(connection.getAccessToken())) {
			tokenCache.putAccessToken(store.getId(), marketplace.getId(), connection.getAccessToken(), TOKEN_CACHE_TTL);
		}
	}

	private void upsertOrder(Store store, Marketplace marketplace, MarketplaceFetchedOrder payload) {
		Order order = orderRepository
				.findByStore_IdAndMarketplace_IdAndExternalOrderId(
						store.getId(), marketplace.getId(), payload.externalOrderId())
				.orElseGet(Order::new);

		CustomerInfo customer = resolveCustomer(store, marketplace, order, payload);
		customer.setStore(store);
		customer.setMarketplace(marketplace);
		if (StringUtils.hasText(payload.externalCustomerId())) {
			customer.setExternalCustomerId(payload.externalCustomerId().trim());
		}
		if (StringUtils.hasText(payload.customerName())) {
			customer.setName(payload.customerName().trim());
		}
		if (StringUtils.hasText(payload.customerEmail())) {
			customer.setEmail(payload.customerEmail().trim());
		}
		if (StringUtils.hasText(payload.customerPhone())) {
			customer.setPhone(payload.customerPhone().trim());
		}
		if (StringUtils.hasText(payload.customerGender())) {
			customer.setGender(payload.customerGender().trim());
		}
		if (StringUtils.hasText(payload.customerAddress())) {
			customer.setAddress(payload.customerAddress().trim());
		}
		customer = customerInfoRepository.save(customer);

		order.setStore(store);
		order.setMarketplace(marketplace);
		order.setCustomer(customer);
		order.setExternalOrderId(payload.externalOrderId());
		order.setExternalOrderDetailJson(payload.externalOrderDetailJson());
		order.setOrderStatus(OrderStatusTextMapper.parse(payload.orderStatus()));
		order.setSourceType(OrderSourceType.API);
		order.setSourceId(null);
		order.setSubtotal(payload.subtotal());
		order.setShippingFee(payload.shippingFee());
		order.setTotalAmount(payload.totalAmount());
		OrderMoneyCalculator.VatBreakdown vat = OrderMoneyCalculator.fromInclusiveTotal(payload.totalAmount());
		order.setAmountExVat(vat.amountExVat());
		order.setVatAmount(vat.vatAmount());
		if (vat.vatAmount() != null) {
			order.setTaxes(vat.vatAmount());
		}
		order.setCurrency(payload.currency());
		// Keep an existing order date when the marketplace payload omitted/failed to parse one.
		if (payload.orderDate() != null) {
			order.setOrderDate(payload.orderDate());
		}
		Order saved = orderRepository.save(order);

		// Only replace line items when the marketplace returned some.
		// Empty list usually means item enrichment failed — do not wipe existing rows.
		if (payload.items() != null && !payload.items().isEmpty()) {
			orderItemRepository.deleteByOrder_Id(saved.getId());
			for (MarketplaceFetchedOrderItem itemPayload : payload.items()) {
				OrderItem item = new OrderItem();
				item.setOrder(saved);
				if (itemPayload.productId() != null) {
					productRepository.findById(itemPayload.productId()).ifPresent(item::setProduct);
				} else if (StringUtils.hasText(itemPayload.sku())) {
					productRepository.findByStore_IdAndSkuIgnoreCase(store.getId(), itemPayload.sku())
							.ifPresent(item::setProduct);
				}
				if (item.getProduct() == null) {
					Product placeholder = new Product();
					placeholder.setStore(store);
					placeholder.setSku(itemPayload.sku());
					placeholder.setName(itemPayload.productName());
					placeholder.setPrice(itemPayload.price());
					item.setProduct(productRepository.save(placeholder));
				}
				item.setSku(itemPayload.sku());
				item.setProductName(itemPayload.productName());
				item.setPrice(itemPayload.price());
				item.setQuantity(itemPayload.quantity());
				item.setLineTotal(itemPayload.lineTotal());
				item.setSourceType(OrderSourceType.API);
				item.setSourceId(null);
				orderItemRepository.save(item);
			}
		} else if (payload.items() != null && payload.items().isEmpty()) {
			log.warn(
					"Order {} synced with empty line items; leaving existing order_items unchanged",
					payload.externalOrderId());
		}
	}

	private CustomerInfo resolveCustomer(
			Store store,
			Marketplace marketplace,
			Order order,
			MarketplaceFetchedOrder payload) {
		if (StringUtils.hasText(payload.externalCustomerId())) {
			var byExternal = customerInfoRepository.findFirstByStore_IdAndMarketplace_IdAndExternalCustomerId(
					store.getId(), marketplace.getId(), payload.externalCustomerId().trim());
			if (byExternal.isPresent()) {
				return byExternal.get();
			}
		}
		if (StringUtils.hasText(payload.customerPhone())) {
			String phone = payload.customerPhone().trim();
			var byPhone = customerInfoRepository.findFirstByStore_IdAndMarketplace_IdAndPhoneIgnoreCase(
					store.getId(), marketplace.getId(), phone);
			if (byPhone.isPresent()) {
				return byPhone.get();
			}
			var legacyByPhone = customerInfoRepository.findFirstByStore_IdAndPhoneIgnoreCaseAndMarketplaceIsNull(
					store.getId(), phone);
			if (legacyByPhone.isPresent()) {
				return legacyByPhone.get();
			}
		}
		if (order.getCustomer() != null) {
			return order.getCustomer();
		}
		return new CustomerInfo();
	}

}
