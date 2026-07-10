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
import com.laconic.lacoinvoice.domain.models.OrderStatus;
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

		CustomerInfo customer = order.getCustomer();
		if (customer == null) {
			customer = new CustomerInfo();
		}
		customer.setStore(store);
		customer.setPhone(payload.customerPhone());
		customer.setGender(payload.customerGender());
		customer.setAddress(payload.customerAddress());
		customer = customerInfoRepository.save(customer);

		order.setStore(store);
		order.setMarketplace(marketplace);
		order.setCustomer(customer);
		order.setExternalOrderId(payload.externalOrderId());
		order.setExternalOrderDetailJson(payload.externalOrderDetailJson());
		order.setOrderStatus(parseStatus(payload.orderStatus()));
		order.setSubtotal(payload.subtotal());
		order.setShippingFee(payload.shippingFee());
		order.setTotalAmount(payload.totalAmount());
		order.setOrderDate(payload.orderDate());
		Order saved = orderRepository.save(order);

		if (payload.items() != null) {
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
				orderItemRepository.save(item);
			}
		}
	}

	private static OrderStatus parseStatus(String raw) {
		if (!StringUtils.hasText(raw)) {
			return OrderStatus.PENDING;
		}
		try {
			return OrderStatus.valueOf(raw.trim().toUpperCase());
		} catch (IllegalArgumentException ex) {
			return OrderStatus.PENDING;
		}
	}
}
