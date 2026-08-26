package com.laconic.lacoinvoice.features.order.import_;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;
import com.laconic.lacoinvoice.domain.models.OrderImportStatus;
import com.laconic.lacoinvoice.domain.models.OrderItem;
import com.laconic.lacoinvoice.domain.models.OrderSourceType;
import com.laconic.lacoinvoice.domain.models.OrderTaxInvoice;
import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.CustomerInfoRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportFileRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderItemRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderTaxInvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.ProductRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.order.OrderMoneyCalculator;
import com.laconic.lacoinvoice.features.order.history.OrderHistoryRecorder;
import com.laconic.lacoinvoice.features.order.history.OrderHistorySnapshot;

@Service
public class OrderImportService {

	private static final Logger log = LoggerFactory.getLogger(OrderImportService.class);
	private static final String DEFAULT_CURRENCY = "THB";

	private final StoreRepository storeRepository;
	private final MarketplaceRepository marketplaceRepository;
	private final OrderImportFileRepository importFileRepository;
	private final OrderRepository orderRepository;
	private final OrderItemRepository orderItemRepository;
	private final CustomerInfoRepository customerInfoRepository;
	private final ProductRepository productRepository;
	private final OrderTaxInvoiceRepository orderTaxInvoiceRepository;
	private final InvoiceRepository invoiceRepository;
	private final OrderSkuListExcelParser excelParser;
	private final OrderHistoryRecorder orderHistoryRecorder;

	public OrderImportService(
			StoreRepository storeRepository,
			MarketplaceRepository marketplaceRepository,
			OrderImportFileRepository importFileRepository,
			OrderRepository orderRepository,
			OrderItemRepository orderItemRepository,
			CustomerInfoRepository customerInfoRepository,
			ProductRepository productRepository,
			OrderTaxInvoiceRepository orderTaxInvoiceRepository,
			InvoiceRepository invoiceRepository,
			OrderSkuListExcelParser excelParser,
			OrderHistoryRecorder orderHistoryRecorder) {
		this.storeRepository = storeRepository;
		this.marketplaceRepository = marketplaceRepository;
		this.importFileRepository = importFileRepository;
		this.orderRepository = orderRepository;
		this.orderItemRepository = orderItemRepository;
		this.customerInfoRepository = customerInfoRepository;
		this.productRepository = productRepository;
		this.orderTaxInvoiceRepository = orderTaxInvoiceRepository;
		this.invoiceRepository = invoiceRepository;
		this.excelParser = excelParser;
		this.orderHistoryRecorder = orderHistoryRecorder;
	}

	/**
	 * Direct import for API clients: NEW orders are created; existing Order IDs are skipped (safe default).
	 * Prefer preview → decide → commit for interactive UI.
	 */
	@Transactional
	public OrderImportResultDto importExcel(Long storeId, String marketplaceCode, MultipartFile file) {
		try {
			byte[] bytes = file.getBytes();
			String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.xlsx";
			return importExcel(storeId, marketplaceCode, filename, bytes);
		} catch (IllegalArgumentException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalArgumentException("Failed to read upload: " + ex.getMessage(), ex);
		}
	}

	@Transactional
	public OrderImportResultDto importExcel(
			Long storeId,
			String marketplaceCode,
			String originalFilename,
			byte[] content) {
		Store store = storeRepository.findById(storeId)
				.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + storeId));
		Marketplace marketplace = marketplaceRepository.findByCodeIgnoreCase(marketplaceCode)
				.orElseThrow(() -> new IllegalArgumentException("Marketplace not found: code=" + marketplaceCode));

		OrderImportFile importFile = new OrderImportFile();
		importFile.setStore(store);
		importFile.setMarketplace(marketplace);
		importFile.setOriginalFilename(
				StringUtils.hasText(originalFilename) ? originalFilename : "upload.xlsx");
		importFile.setStatus(OrderImportStatus.COMPLETED);
		importFile = importFileRepository.save(importFile);

		OrderImportResultDto result = new OrderImportResultDto();
		result.setImportFileId(importFile.getId());

		try {
			ParsedOrderSkuListWorkbook workbook =
					excelParser.parse(new java.io.ByteArrayInputStream(content));
			result.setSheetName(workbook.sheetName());
			result.setRowCount(workbook.rowCount());
			importFile.setSheetName(workbook.sheetName());
			importFile.setRowCount(workbook.rowCount());

			int orderCount = 0;
			int itemCount = 0;
			int failedOrders = 0;
			int skippedDuplicates = 0;

			for (OrderSkuListExcelRow row : workbook.ordersByExternalId().values()) {
				try {
					boolean exists = orderRepository
							.findByStore_IdAndMarketplace_IdAndExternalOrderId(
									store.getId(), marketplace.getId(), row.orderId())
							.isPresent();
					if (exists) {
						skippedDuplicates++;
						continue;
					}
					int items = createOrder(store, marketplace, importFile, row);
					orderCount++;
					itemCount += items;
				} catch (Exception ex) {
					failedOrders++;
					String message = "Order " + row.orderId() + ": " + ex.getMessage();
					result.getErrors().add(message);
					log.warn("Failed to import order {}: {}", row.orderId(), ex.getMessage(), ex);
				}
			}

			if (skippedDuplicates > 0) {
				result.getErrors().add(
						"Skipped " + skippedDuplicates
								+ " duplicate Order ID(s). Use import preview to MERGE or REPLACE.");
			}

			result.setOrderCount(orderCount);
			result.setItemCount(itemCount);
			importFile.setImportedOrders(orderCount);
			importFile.setImportedItems(itemCount);

			if (workbook.ordersByExternalId().isEmpty() && workbook.rowCount() == 0) {
				importFile.setStatus(OrderImportStatus.FAILED);
				result.setStatus(OrderImportStatus.FAILED);
				result.getErrors().add(
						"No order rows found in Excel. Check that the sheet has an Order ID header and data rows.");
			} else if (failedOrders > 0 && orderCount == 0) {
				importFile.setStatus(OrderImportStatus.FAILED);
				result.setStatus(OrderImportStatus.FAILED);
			} else if (failedOrders > 0 || skippedDuplicates > 0) {
				importFile.setStatus(OrderImportStatus.PARTIAL);
				result.setStatus(OrderImportStatus.PARTIAL);
			} else {
				importFile.setStatus(OrderImportStatus.COMPLETED);
				result.setStatus(OrderImportStatus.COMPLETED);
			}
		} catch (Exception ex) {
			importFile.setStatus(OrderImportStatus.FAILED);
			result.setStatus(OrderImportStatus.FAILED);
			result.getErrors().add(ex.getMessage());
			log.error("Order import failed for fileId={}", importFile.getId(), ex);
		}

		importFileRepository.save(importFile);
		return result;
	}

	@Transactional
	public int createOrder(Store store, Marketplace marketplace, OrderImportFile importFile, OrderSkuListExcelRow row) {
		boolean exists = orderRepository
				.findByStore_IdAndMarketplace_IdAndExternalOrderId(
						store.getId(), marketplace.getId(), row.orderId())
				.isPresent();
		if (exists) {
			throw new IllegalStateException("Order already exists: " + row.orderId());
		}
		int itemCount = upsertOrder(store, marketplace, importFile, row);
		Order saved = orderRepository
				.findByStore_IdAndMarketplace_IdAndExternalOrderId(
						store.getId(), marketplace.getId(), row.orderId())
				.orElseThrow(() -> new IllegalStateException("Order not found after CREATE: " + row.orderId()));
		orderHistoryRecorder.recordImportCreate(saved, importFile, OrderHistorySnapshot.capture(saved));
		return itemCount;
	}

	@Transactional
	public int replaceOrder(Store store, Marketplace marketplace, OrderImportFile importFile, OrderSkuListExcelRow row) {
		Order existing = orderRepository
				.findByStore_IdAndMarketplace_IdAndExternalOrderId(
						store.getId(), marketplace.getId(), row.orderId())
				.orElseThrow(() -> new IllegalStateException("Order not found for REPLACE: " + row.orderId()));
		if (invoiceRepository.existsByOrder_Id(existing.getId())) {
			throw new IllegalArgumentException(
					"REPLACE blocked for order " + row.orderId() + " because an invoice already exists");
		}
		OrderHistorySnapshot before = OrderHistorySnapshot.capture(existing);
		int itemCount = upsertOrder(store, marketplace, importFile, row);
		Order after = orderRepository
				.findByStore_IdAndMarketplace_IdAndExternalOrderId(
						store.getId(), marketplace.getId(), row.orderId())
				.orElseThrow(() -> new IllegalStateException("Order not found after REPLACE: " + row.orderId()));
		orderHistoryRecorder.recordImportUpdate(after, importFile, before, OrderHistorySnapshot.capture(after));
		return itemCount;
	}

	@Transactional
	public int mergeOrder(
			Store store,
			Marketplace marketplace,
			OrderImportFile importFile,
			Order order,
			OrderSkuListExcelRow row) {
		OrderHistorySnapshot before = OrderHistorySnapshot.capture(order);
		CustomerInfo customer = order.getCustomer();
		if (customer == null) {
			customer = resolveCustomer(store, marketplace, row);
			customer.setStore(store);
			customer.setMarketplace(marketplace);
		} else {
			applyCustomerFieldsPreferExcel(customer, row);
		}
		customer = customerInfoRepository.save(customer);
		order.setCustomer(customer);

		applyHeaderPreferExcel(order, row);
		order.setCurrency(resolveCurrency(order));
		order.setSourceType(OrderSourceType.IMPORT);
		order.setSourceId(importFile.getId());

		Map<String, OrderItem> byKey = new HashMap<>();
		for (OrderItem item : orderItemRepository.findByOrder_Id(order.getId())) {
			byKey.put(
					OrderImportPreviewService.lineKey(item.getPlatformSkuId(), item.getSku(), item.getVariation()),
					item);
		}

		Long sourceId = importFile.getId();
		for (OrderSkuListLineItem line : row.lineItems()) {
			applyLineItemFallbacks(line);
			String key = OrderImportPreviewService.lineKey(
					line.getPlatformSkuId(), line.getSellerSku(), line.getVariation());
			OrderItem existingItem = byKey.get(key);
			if (existingItem != null) {
				existingItem.setQuantity(
						OrderImportPreviewService.nullSafeInt(existingItem.getQuantity())
								+ OrderImportPreviewService.nullSafeInt(line.getQuantity()));
				existingItem.setQuantityReturned(
						OrderImportPreviewService.nullSafeInt(existingItem.getQuantityReturned())
								+ OrderImportPreviewService.nullSafeInt(line.getQuantityReturned()));
				existingItem.setLineTotal(
						OrderImportPreviewService.nullSafeAdd(existingItem.getLineTotal(), line.getLineTotal()));
				existingItem.setSubtotalBeforeDiscount(OrderImportPreviewService.nullSafeAdd(
						existingItem.getSubtotalBeforeDiscount(), line.getSubtotalBeforeDiscount()));
				existingItem.setItemPlatformDiscount(OrderImportPreviewService.nullSafeAdd(
						existingItem.getItemPlatformDiscount(), line.getPlatformDiscount()));
				existingItem.setItemSellerDiscount(OrderImportPreviewService.nullSafeAdd(
						existingItem.getItemSellerDiscount(), line.getSellerDiscount()));
				if (line.getUnitPrice() != null) {
					existingItem.setPrice(line.getUnitPrice());
				}
				if (StringUtils.hasText(line.getProductName())) {
					existingItem.setProductName(line.getProductName());
				}
				if (StringUtils.hasText(line.getProductCategory())) {
					existingItem.setProductCategory(line.getProductCategory());
				}
				if (line.getWeightKg() != null) {
					existingItem.setWeightKg(line.getWeightKg());
				}
				existingItem.setSourceType(OrderSourceType.IMPORT);
				existingItem.setSourceId(sourceId);
				orderItemRepository.save(existingItem);
			} else {
				OrderItem item = new OrderItem();
				item.setOrder(order);
				item.setProduct(resolveProduct(store, marketplace, line));
				item.setPlatformSkuId(line.getPlatformSkuId());
				item.setSku(line.getSellerSku());
				item.setProductName(line.getProductName());
				item.setVariation(line.getVariation());
				item.setQuantity(line.getQuantity());
				item.setQuantityReturned(line.getQuantityReturned());
				item.setPrice(line.getUnitPrice());
				item.setSubtotalBeforeDiscount(line.getSubtotalBeforeDiscount());
				item.setItemPlatformDiscount(line.getPlatformDiscount());
				item.setItemSellerDiscount(line.getSellerDiscount());
				item.setLineTotal(line.getLineTotal());
				item.setWeightKg(line.getWeightKg());
				item.setProductCategory(line.getProductCategory());
				item.setSourceType(OrderSourceType.IMPORT);
				item.setSourceId(sourceId);
				OrderItem saved = orderItemRepository.save(item);
				byKey.put(key, saved);
			}
		}

		List<OrderItem> allItems = orderItemRepository.findByOrder_Id(order.getId());
		order.setSubtotal(sumOrderItemLineTotals(allItems));
		if (row.getTotalAmount() != null) {
			order.setTotalAmount(row.getTotalAmount());
		} else {
			BigDecimal shipping = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
			BigDecimal sub = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
			order.setTotalAmount(sub.add(shipping));
		}
		applyVatBreakdown(order);
		orderRepository.save(order);
		upsertTaxInvoice(order, row);
		orderHistoryRecorder.recordImportUpdate(order, importFile, before, OrderHistorySnapshot.capture(order));
		return allItems.size();
	}

	private int upsertOrder(
			Store store,
			Marketplace marketplace,
			OrderImportFile importFile,
			OrderSkuListExcelRow row) {
		Order order = orderRepository
				.findByStore_IdAndMarketplace_IdAndExternalOrderId(
						store.getId(), marketplace.getId(), row.orderId())
				.orElseGet(Order::new);

		CustomerInfo customer = resolveCustomer(store, marketplace, row);
		customer.setStore(store);
		customer.setMarketplace(marketplace);
		customer = customerInfoRepository.save(customer);

		order.setStore(store);
		order.setMarketplace(marketplace);
		order.setCustomer(customer);
		order.setExternalOrderId(row.orderId());
		order.setOrderStatus(OrderStatusTextMapper.parse(row.getOrderStatus()));
		order.setOrderSubstatus(row.getOrderSubstatus());
		order.setCancelReturnType(row.getCancelReturnType());
		order.setOrderKind(row.getOrderKind());
		applyShippingAndTotals(order, row);
		order.setPaymentPlatformDiscount(row.getPaymentPlatformDiscount());
		order.setRefundAmount(row.getRefundAmount());
		order.setCurrency(resolveCurrency(order));
		order.setOrderDate(row.getOrderDate());
		order.setPaidAt(row.getPaidAt());
		order.setRtsAt(row.getRtsAt());
		order.setShippedAt(row.getShippedAt());
		order.setDeliveredAt(row.getDeliveredAt());
		order.setCancelledAt(row.getCancelledAt());
		order.setCancelBy(row.getCancelBy());
		order.setCancelReason(row.getCancelReason());
		order.setFulfillmentType(row.getFulfillmentType());
		order.setWarehouseName(row.getWarehouseName());
		order.setTrackingId(row.getTrackingId());
		order.setDeliveryOption(row.getDeliveryOption());
		order.setShippingProviderName(row.getShippingProviderName());
		order.setBuyerMessage(row.getBuyerMessage());
		order.setPaymentMethod(row.getPaymentMethod());
		order.setPackageId(row.getPackageId());
		order.setSellerNote(row.getSellerNote());
		order.setCheckedStatus(row.getCheckedStatus());
		order.setCheckedMarkedBy(row.getCheckedMarkedBy());
		order.setSourceType(OrderSourceType.IMPORT);
		order.setSourceId(importFile.getId());
		order.setSubtotal(sumLineTotals(row.lineItems()));
		applyVatBreakdown(order);

		Order saved = orderRepository.save(order);
		orderItemRepository.deleteByOrder_Id(saved.getId());

		Long sourceId = importFile.getId();
		for (OrderSkuListLineItem line : row.lineItems()) {
			applyLineItemFallbacks(line);
			OrderItem item = new OrderItem();
			item.setOrder(saved);
			item.setProduct(resolveProduct(store, marketplace, line));
			item.setPlatformSkuId(line.getPlatformSkuId());
			item.setSku(line.getSellerSku());
			item.setProductName(line.getProductName());
			item.setVariation(line.getVariation());
			item.setQuantity(line.getQuantity());
			item.setQuantityReturned(line.getQuantityReturned());
			item.setPrice(line.getUnitPrice());
			item.setSubtotalBeforeDiscount(line.getSubtotalBeforeDiscount());
			item.setItemPlatformDiscount(line.getPlatformDiscount());
			item.setItemSellerDiscount(line.getSellerDiscount());
			item.setLineTotal(line.getLineTotal());
			item.setWeightKg(line.getWeightKg());
			item.setProductCategory(line.getProductCategory());
			item.setSourceType(OrderSourceType.IMPORT);
			item.setSourceId(sourceId);
			orderItemRepository.save(item);
		}

		upsertTaxInvoice(saved, row);
		return row.lineItems().size();
	}

	private void applyHeaderPreferExcel(Order order, OrderSkuListExcelRow row) {
		if (StringUtils.hasText(row.getOrderStatus())) {
			order.setOrderStatus(OrderStatusTextMapper.parse(row.getOrderStatus()));
		}
		order.setOrderSubstatus(OrderImportPreviewService.prefer(row.getOrderSubstatus(), order.getOrderSubstatus()));
		order.setCancelReturnType(
				OrderImportPreviewService.prefer(row.getCancelReturnType(), order.getCancelReturnType()));
		order.setOrderKind(OrderImportPreviewService.prefer(row.getOrderKind(), order.getOrderKind()));
		if (row.getShippingFeeOriginal() != null
				|| row.getShippingFeeSellerDisc() != null
				|| row.getShippingFeePlatformDisc() != null
				|| row.getShippingFeeAfterDiscount() != null) {
			applyShippingAndTotals(order, row);
		}
		if (row.getPaymentPlatformDiscount() != null) {
			order.setPaymentPlatformDiscount(row.getPaymentPlatformDiscount());
		}
		if (row.getRefundAmount() != null) {
			order.setRefundAmount(row.getRefundAmount());
		}
		if (row.getTaxes() != null) {
			order.setTaxes(row.getTaxes());
		}
		order.setOrderDate(OrderImportPreviewService.prefer(row.getOrderDate(), order.getOrderDate()));
		order.setPaidAt(OrderImportPreviewService.prefer(row.getPaidAt(), order.getPaidAt()));
		order.setRtsAt(OrderImportPreviewService.prefer(row.getRtsAt(), order.getRtsAt()));
		order.setShippedAt(OrderImportPreviewService.prefer(row.getShippedAt(), order.getShippedAt()));
		order.setDeliveredAt(OrderImportPreviewService.prefer(row.getDeliveredAt(), order.getDeliveredAt()));
		order.setCancelledAt(OrderImportPreviewService.prefer(row.getCancelledAt(), order.getCancelledAt()));
		order.setCancelBy(OrderImportPreviewService.prefer(row.getCancelBy(), order.getCancelBy()));
		order.setCancelReason(OrderImportPreviewService.prefer(row.getCancelReason(), order.getCancelReason()));
		order.setFulfillmentType(
				OrderImportPreviewService.prefer(row.getFulfillmentType(), order.getFulfillmentType()));
		order.setWarehouseName(OrderImportPreviewService.prefer(row.getWarehouseName(), order.getWarehouseName()));
		order.setTrackingId(OrderImportPreviewService.prefer(row.getTrackingId(), order.getTrackingId()));
		order.setDeliveryOption(OrderImportPreviewService.prefer(row.getDeliveryOption(), order.getDeliveryOption()));
		order.setShippingProviderName(
				OrderImportPreviewService.prefer(row.getShippingProviderName(), order.getShippingProviderName()));
		order.setBuyerMessage(OrderImportPreviewService.prefer(row.getBuyerMessage(), order.getBuyerMessage()));
		order.setPaymentMethod(OrderImportPreviewService.prefer(row.getPaymentMethod(), order.getPaymentMethod()));
		order.setPackageId(OrderImportPreviewService.prefer(row.getPackageId(), order.getPackageId()));
		order.setSellerNote(OrderImportPreviewService.prefer(row.getSellerNote(), order.getSellerNote()));
		order.setCheckedStatus(OrderImportPreviewService.prefer(row.getCheckedStatus(), order.getCheckedStatus()));
		order.setCheckedMarkedBy(
				OrderImportPreviewService.prefer(row.getCheckedMarkedBy(), order.getCheckedMarkedBy()));
	}

	private CustomerInfo applyCustomerFieldsPreferExcel(CustomerInfo customer, OrderSkuListExcelRow row) {
		if (StringUtils.hasText(row.getBuyerUsername())) {
			customer.setExternalCustomerId(row.getBuyerUsername().trim());
		}
		if (StringUtils.hasText(row.getRecipient())) {
			customer.setName(row.getRecipient().trim());
		}
		if (StringUtils.hasText(row.getPhone())) {
			customer.setPhone(row.getPhone().trim());
		}
		if (StringUtils.hasText(row.getDetailAddress())) {
			customer.setAddress(row.getDetailAddress().trim());
		}
		if (row.getZipcode() != null) {
			customer.setZipcode(row.getZipcode());
		}
		if (row.getCountry() != null) {
			customer.setCountry(row.getCountry());
		}
		if (row.getProvince() != null) {
			customer.setProvince(row.getProvince());
		}
		if (row.getDistrict() != null) {
			customer.setDistrict(row.getDistrict());
		}
		if (row.getSubDistrict() != null) {
			customer.setSubDistrict(row.getSubDistrict());
		}
		if (row.getAdditionalAddressInfo() != null) {
			customer.setAdditionalAddressInfo(row.getAdditionalAddressInfo());
		}
		return customer;
	}

	private CustomerInfo resolveCustomer(Store store, Marketplace marketplace, OrderSkuListExcelRow row) {
		if (StringUtils.hasText(row.getBuyerUsername())) {
			var existing = customerInfoRepository.findFirstByStore_IdAndMarketplace_IdAndExternalCustomerId(
					store.getId(), marketplace.getId(), row.getBuyerUsername().trim());
			if (existing.isPresent()) {
				return applyCustomerFields(existing.get(), row);
			}
		}
		if (StringUtils.hasText(row.getPhone())) {
			var byPhone = customerInfoRepository.findFirstByStore_IdAndMarketplace_IdAndPhoneIgnoreCase(
					store.getId(), marketplace.getId(), row.getPhone().trim());
			if (byPhone.isPresent()) {
				return applyCustomerFields(byPhone.get(), row);
			}
		}
		return applyCustomerFields(new CustomerInfo(), row);
	}

	private CustomerInfo applyCustomerFields(CustomerInfo customer, OrderSkuListExcelRow row) {
		if (StringUtils.hasText(row.getBuyerUsername())) {
			customer.setExternalCustomerId(row.getBuyerUsername().trim());
		}
		if (StringUtils.hasText(row.getRecipient())) {
			customer.setName(row.getRecipient().trim());
		}
		if (StringUtils.hasText(row.getPhone())) {
			customer.setPhone(row.getPhone().trim());
		}
		if (StringUtils.hasText(row.getDetailAddress())) {
			customer.setAddress(row.getDetailAddress().trim());
		}
		customer.setZipcode(row.getZipcode());
		customer.setCountry(row.getCountry());
		customer.setProvince(row.getProvince());
		customer.setDistrict(row.getDistrict());
		customer.setSubDistrict(row.getSubDistrict());
		customer.setAdditionalAddressInfo(row.getAdditionalAddressInfo());
		return customer;
	}

	private Product resolveProduct(Store store, Marketplace marketplace, OrderSkuListLineItem line) {
		if (StringUtils.hasText(line.getSellerSku())) {
			var existing = productRepository.findByStore_IdAndSkuIgnoreCase(store.getId(), line.getSellerSku().trim());
			if (existing.isPresent()) {
				return existing.get();
			}
		}
		Product placeholder = new Product();
		placeholder.setStore(store);
		placeholder.setSku(line.getSellerSku());
		placeholder.setName(line.getProductName());
		placeholder.setPrice(line.getUnitPrice());
		placeholder.setMarketplaceCode(marketplace.getCode());
		placeholder.setExternalProductId(line.getPlatformSkuId());
		placeholder.setCurrency(DEFAULT_CURRENCY);
		return productRepository.save(placeholder);
	}

	private void upsertTaxInvoice(Order order, OrderSkuListExcelRow row) {
		boolean hasTaxData = row.isTaxInvoiceRequested()
				|| StringUtils.hasText(row.getTaxBuyerTaxId())
				|| StringUtils.hasText(row.getTaxFullName());
		if (!hasTaxData) {
			return;
		}
		OrderTaxInvoice tax = orderTaxInvoiceRepository.findByOrder_Id(order.getId()).orElseGet(OrderTaxInvoice::new);
		tax.setOrder(order);
		tax.setRequested(row.isTaxInvoiceRequested());
		tax.setBuyerTaxId(row.getTaxBuyerTaxId());
		tax.setTaxType(row.getTaxType());
		tax.setFullName(row.getTaxFullName());
		tax.setEmail(row.getTaxEmail());
		tax.setPhoneNumber(row.getTaxPhone());
		tax.setRegisteredAddress(row.getTaxRegisteredAddress());
		tax.setAddressType(row.getTaxAddressType());
		orderTaxInvoiceRepository.save(tax);
	}

	private static String resolveCurrency(Order order) {
		return StringUtils.hasText(order.getCurrency()) ? order.getCurrency() : DEFAULT_CURRENCY;
	}

	private static void applyShippingAndTotals(Order order, OrderSkuListExcelRow row) {
		order.setShippingFeeOriginal(row.getShippingFeeOriginal());
		order.setShippingFeeSellerDisc(row.getShippingFeeSellerDisc());
		order.setShippingFeePlatformDisc(row.getShippingFeePlatformDisc());

		BigDecimal shippingAfter = row.getShippingFeeAfterDiscount();
		if (shippingAfter == null
				&& (row.getShippingFeeOriginal() != null
						|| row.getShippingFeeSellerDisc() != null
						|| row.getShippingFeePlatformDisc() != null)) {
			shippingAfter = OrderMoneyCalculator.shippingFeeAfterDiscount(
					row.getShippingFeeOriginal(),
					row.getShippingFeeSellerDisc(),
					row.getShippingFeePlatformDisc());
		}
		order.setShippingFee(shippingAfter);
		order.setTaxes(row.getTaxes());
		order.setTotalAmount(row.getTotalAmount());
	}

	private static void applyLineItemFallbacks(OrderSkuListLineItem line) {
		if (line.getSubtotalBeforeDiscount() == null) {
			line.setSubtotalBeforeDiscount(
					OrderMoneyCalculator.skuSubtotalBeforeDiscount(line.getUnitPrice(), line.getQuantity()));
		}
		if (line.getSellerDiscount() == null) {
			line.setSellerDiscount(OrderMoneyCalculator.skuSellerDiscount(
					line.getSubtotalBeforeDiscount(),
					line.getPlatformDiscount(),
					line.getLineTotal()));
		}
	}

	private static void applyVatBreakdown(Order order) {
		OrderMoneyCalculator.VatBreakdown vat = OrderMoneyCalculator.fromInclusiveTotal(order.getTotalAmount());
		order.setAmountExVat(vat.amountExVat());
		order.setVatAmount(vat.vatAmount());
		if (order.getTaxes() == null && vat.vatAmount() != null) {
			order.setTaxes(vat.vatAmount());
		}
	}

	private static BigDecimal sumLineTotals(Collection<OrderSkuListLineItem> lines) {
		BigDecimal total = BigDecimal.ZERO;
		for (OrderSkuListLineItem line : lines) {
			if (line.getLineTotal() != null) {
				total = total.add(line.getLineTotal());
			}
		}
		return total.compareTo(BigDecimal.ZERO) == 0 ? null : total;
	}

	private static BigDecimal sumOrderItemLineTotals(Collection<OrderItem> items) {
		BigDecimal total = BigDecimal.ZERO;
		for (OrderItem item : items) {
			if (item.getLineTotal() != null) {
				total = total.add(item.getLineTotal());
			}
		}
		return total.compareTo(BigDecimal.ZERO) == 0 ? null : total;
	}
}
