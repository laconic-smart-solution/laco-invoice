package com.laconic.lacoinvoice.features.order.import_;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderImportBatch;
import com.laconic.lacoinvoice.domain.models.OrderImportBatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;
import com.laconic.lacoinvoice.domain.models.OrderImportMatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderImportPreviewItem;
import com.laconic.lacoinvoice.domain.models.OrderImportPreviewOrder;
import com.laconic.lacoinvoice.domain.models.OrderImportResolveAction;
import com.laconic.lacoinvoice.domain.models.OrderImportStatus;
import com.laconic.lacoinvoice.domain.models.OrderItem;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportBatchRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportFileRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportPreviewItemRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportPreviewOrderRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderItemRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.order.import_.OrderImportDecideRequest.OrderImportDecideUpdate;
import com.laconic.lacoinvoice.features.order.import_.OrderImportPreviewBatchDto.OrderImportPreviewOrderDto;

@Service
public class OrderImportPreviewService {

	private static final Logger log = LoggerFactory.getLogger(OrderImportPreviewService.class);
	private static final long PREVIEW_TTL_HOURS = 24;
	private static final String WARNING_HAS_INVOICE = "HAS_INVOICE";
	private static final String RESOLVE_SOURCE_AUTO = "AUTO";
	private static final String RESOLVE_SOURCE_USER = "USER";

	private static final ObjectMapper MAPPER = new ObjectMapper()
			.registerModule(new JavaTimeModule())
			.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

	private final StoreRepository storeRepository;
	private final MarketplaceRepository marketplaceRepository;
	private final OrderRepository orderRepository;
	private final OrderItemRepository orderItemRepository;
	private final InvoiceRepository invoiceRepository;
	private final OrderImportBatchRepository batchRepository;
	private final OrderImportPreviewOrderRepository previewOrderRepository;
	private final OrderImportPreviewItemRepository previewItemRepository;
	private final OrderImportFileRepository importFileRepository;
	private final OrderSkuListExcelParser excelParser;
	private final OrderImportService importService;

	public OrderImportPreviewService(
			StoreRepository storeRepository,
			MarketplaceRepository marketplaceRepository,
			OrderRepository orderRepository,
			OrderItemRepository orderItemRepository,
			InvoiceRepository invoiceRepository,
			OrderImportBatchRepository batchRepository,
			OrderImportPreviewOrderRepository previewOrderRepository,
			OrderImportPreviewItemRepository previewItemRepository,
			OrderImportFileRepository importFileRepository,
			OrderSkuListExcelParser excelParser,
			OrderImportService importService) {
		this.storeRepository = storeRepository;
		this.marketplaceRepository = marketplaceRepository;
		this.orderRepository = orderRepository;
		this.orderItemRepository = orderItemRepository;
		this.invoiceRepository = invoiceRepository;
		this.batchRepository = batchRepository;
		this.previewOrderRepository = previewOrderRepository;
		this.previewItemRepository = previewItemRepository;
		this.importFileRepository = importFileRepository;
		this.excelParser = excelParser;
		this.importService = importService;
	}

	@Transactional
	public OrderImportPreviewBatchDto preview(Long storeId, String marketplaceCode, MultipartFile file) {
		String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.xlsx";
		return preview(storeId, marketplaceCode, filename, excelParser.parse(file));
	}

	@Transactional
	public OrderImportPreviewBatchDto preview(
			Long storeId,
			String marketplaceCode,
			String originalFilename,
			byte[] content) {
		if (content == null || content.length == 0) {
			throw new IllegalArgumentException("Excel content is empty");
		}
		return preview(
				storeId,
				marketplaceCode,
				StringUtils.hasText(originalFilename) ? originalFilename : "upload.xlsx",
				excelParser.parse(new java.io.ByteArrayInputStream(content)));
	}

	@Transactional
	public OrderImportPreviewBatchDto preview(
			Long storeId,
			String marketplaceCode,
			String originalFilename,
			ParsedOrderSkuListWorkbook workbook) {
		Store store = requireStore(storeId);
		Marketplace marketplace = requireMarketplace(marketplaceCode);

		OrderImportBatch batch = new OrderImportBatch();
		batch.setStore(store);
		batch.setMarketplace(marketplace);
		batch.setOriginalFilename(
				StringUtils.hasText(originalFilename) ? originalFilename : "upload.xlsx");
		batch.setSheetName(workbook.sheetName());
		batch.setStatus(OrderImportBatchStatus.PREVIEW);
		batch.setRowCount(workbook.rowCount());
		batch.setExpiresAt(Instant.now().plus(PREVIEW_TTL_HOURS, ChronoUnit.HOURS));
		AuditUserContext.getCurrentLocalUserId().ifPresent(batch::setCreatedByUserId);
		batch = batchRepository.save(batch);

		Map<String, Order> existingByExternalId = new HashMap<>();
		if (!workbook.ordersByExternalId().isEmpty()) {
			List<Order> existingOrders = orderRepository.findByStore_IdAndMarketplace_IdAndExternalOrderIdIn(
					store.getId(),
					marketplace.getId(),
					workbook.ordersByExternalId().keySet());
			for (Order existing : existingOrders) {
				if (existing.getExternalOrderId() != null) {
					existingByExternalId.put(existing.getExternalOrderId(), existing);
				}
			}
		}

		int newCount = 0;
		int duplicateCount = 0;

		for (OrderSkuListExcelRow row : workbook.ordersByExternalId().values()) {
			OrderImportPreviewOrder preview = new OrderImportPreviewOrder();
			preview.setBatch(batch);
			preview.setExternalOrderId(row.orderId());
			preview.setExcelItemCount(row.lineItems().size());
			preview.setExcelTotalAmount(row.getTotalAmount());
			preview.setHeaderJson(toHeaderJson(row));

			Order existing = existingByExternalId.get(row.orderId());

			if (existing != null) {
				preview.setMatchStatus(OrderImportMatchStatus.DUPLICATE);
				preview.setExistingOrder(existing);
				preview.setExistingItemCount((int) orderItemRepository.countByOrder_Id(existing.getId()));
				preview.setExistingTotalAmount(existing.getTotalAmount());
				if (invoiceRepository.existsByOrder_Id(existing.getId())) {
					preview.setWarningCode(WARNING_HAS_INVOICE);
				}
				duplicateCount++;
			} else {
				preview.setMatchStatus(OrderImportMatchStatus.NEW);
				preview.setResolveAction(OrderImportResolveAction.CREATE);
				preview.setResolveSource(RESOLVE_SOURCE_AUTO);
				preview.setExistingItemCount(0);
				newCount++;
			}

			preview = previewOrderRepository.save(preview);
			savePreviewItems(preview, row);
		}

		batch.setTotalOrders(newCount + duplicateCount);
		batch.setNewCount(newCount);
		batch.setDuplicateCount(duplicateCount);
		batchRepository.save(batch);

		return toBatchDto(batch);
	}

	@Transactional
	public OrderImportPreviewBatchDto decide(Long storeId, Long batchId, OrderImportDecideRequest request) {
		OrderImportBatch batch = requirePreviewBatch(storeId, batchId);

		if (request.getBulkDuplicatesAction() != null) {
			OrderImportResolveAction bulk = request.getBulkDuplicatesAction();
			validateDuplicateAction(bulk);
			List<OrderImportPreviewOrder> duplicates = previewOrderRepository.findByBatch_IdAndMatchStatus(
					batch.getId(), OrderImportMatchStatus.DUPLICATE);
			for (OrderImportPreviewOrder preview : duplicates) {
				applyAction(preview, bulk, RESOLVE_SOURCE_USER);
			}
			previewOrderRepository.saveAll(duplicates);
		}

		if (request.getUpdates() != null && !request.getUpdates().isEmpty()) {
			for (OrderImportDecideUpdate update : request.getUpdates()) {
				if (update.getPreviewOrderId() == null || update.getResolveAction() == null) {
					throw new IllegalArgumentException("previewOrderId and resolveAction are required");
				}
				OrderImportPreviewOrder preview = previewOrderRepository
						.findByIdAndBatch_Id(update.getPreviewOrderId(), batch.getId())
						.orElseThrow(() -> new IllegalArgumentException(
								"Preview order not found: id=" + update.getPreviewOrderId()));
				applyAction(preview, update.getResolveAction(), RESOLVE_SOURCE_USER);
				previewOrderRepository.save(preview);
			}
		}

		return toBatchDto(batch);
	}

	@Transactional
	public OrderImportResultDto commit(Long storeId, Long batchId) {
		OrderImportBatch batch = requirePreviewBatch(storeId, batchId);
		Store store = batch.getStore();
		Marketplace marketplace = batch.getMarketplace();

		List<OrderImportPreviewOrder> previews = previewOrderRepository.findByBatch_IdOrderByIdAsc(batch.getId());
		for (OrderImportPreviewOrder preview : previews) {
			if (preview.getResolveAction() == null) {
				throw new IllegalArgumentException(
						"Unresolved duplicate order: " + preview.getExternalOrderId()
								+ ". Choose MERGE, SKIP, or REPLACE before commit.");
			}
		}

		OrderImportFile importFile = new OrderImportFile();
		importFile.setStore(store);
		importFile.setMarketplace(marketplace);
		importFile.setOriginalFilename(batch.getOriginalFilename());
		importFile.setSheetName(batch.getSheetName());
		importFile.setRowCount(batch.getRowCount());
		importFile.setStatus(OrderImportStatus.COMPLETED);
		importFile = importFileRepository.save(importFile);

		OrderImportResultDto result = new OrderImportResultDto();
		result.setImportFileId(importFile.getId());
		result.setSheetName(batch.getSheetName());
		result.setRowCount(batch.getRowCount() != null ? batch.getRowCount() : 0);

		int orderCount = 0;
		int itemCount = 0;
		int failedOrders = 0;
		int skipped = 0;

		for (OrderImportPreviewOrder preview : previews) {
			OrderImportResolveAction action = preview.getResolveAction();
			if (action == OrderImportResolveAction.SKIP) {
				skipped++;
				continue;
			}
			try {
				OrderSkuListExcelRow row = reconstructRow(preview);
				int items;
				switch (action) {
					case CREATE -> items = importService.createOrder(store, marketplace, importFile, row);
					case REPLACE -> {
						assertReplaceAllowed(preview);
						items = importService.replaceOrder(store, marketplace, importFile, row);
					}
					case MERGE -> {
						Order existing = preview.getExistingOrder();
						if (existing == null) {
							throw new IllegalStateException(
									"MERGE requires existing order for " + preview.getExternalOrderId());
						}
						items = importService.mergeOrder(store, marketplace, importFile, existing, row);
					}
					default -> throw new IllegalStateException("Unexpected action: " + action);
				}
				orderCount++;
				itemCount += items;
			} catch (Exception ex) {
				failedOrders++;
				String message = "Order " + preview.getExternalOrderId() + ": " + ex.getMessage();
				result.getErrors().add(message);
				log.warn("Failed to commit preview order {}: {}", preview.getExternalOrderId(), ex.getMessage(), ex);
			}
		}

		result.setOrderCount(orderCount);
		result.setItemCount(itemCount);
		importFile.setImportedOrders(orderCount);
		importFile.setImportedItems(itemCount);

		if (previews.isEmpty() && (batch.getRowCount() == null || batch.getRowCount() == 0)) {
			importFile.setStatus(OrderImportStatus.FAILED);
			result.setStatus(OrderImportStatus.FAILED);
			result.getErrors().add("No order rows found in preview batch.");
		} else if (failedOrders > 0 && orderCount == 0 && skipped == 0) {
			importFile.setStatus(OrderImportStatus.FAILED);
			result.setStatus(OrderImportStatus.FAILED);
		} else if (failedOrders > 0) {
			importFile.setStatus(OrderImportStatus.PARTIAL);
			result.setStatus(OrderImportStatus.PARTIAL);
		} else {
			importFile.setStatus(OrderImportStatus.COMPLETED);
			result.setStatus(OrderImportStatus.COMPLETED);
		}

		importFileRepository.save(importFile);

		batch.setStatus(OrderImportBatchStatus.COMMITTED);
		batch.setCommittedAt(Instant.now());
		batch.setCommittedImportFile(importFile);
		batchRepository.save(batch);

		return result;
	}

	@Transactional(readOnly = true)
	public OrderImportPreviewBatchDto getPreview(Long storeId, Long batchId) {
		OrderImportBatch batch = requirePreviewBatch(storeId, batchId);
		return toBatchDto(batch);
	}

	private void applyAction(OrderImportPreviewOrder preview, OrderImportResolveAction action, String source) {
		if (preview.getMatchStatus() == OrderImportMatchStatus.NEW) {
			if (action != OrderImportResolveAction.CREATE && action != OrderImportResolveAction.SKIP) {
				throw new IllegalArgumentException(
						"NEW orders only support CREATE or SKIP: " + preview.getExternalOrderId());
			}
		} else {
			validateDuplicateAction(action);
			if (action == OrderImportResolveAction.REPLACE) {
				assertReplaceAllowed(preview);
			}
		}
		preview.setResolveAction(action);
		preview.setResolveSource(source);
	}

	private static void validateDuplicateAction(OrderImportResolveAction action) {
		if (action != OrderImportResolveAction.MERGE
				&& action != OrderImportResolveAction.SKIP
				&& action != OrderImportResolveAction.REPLACE) {
			throw new IllegalArgumentException(
					"Duplicate orders require MERGE, SKIP, or REPLACE; got " + action);
		}
	}

	private void assertReplaceAllowed(OrderImportPreviewOrder preview) {
		if (WARNING_HAS_INVOICE.equals(preview.getWarningCode())) {
			throw new IllegalArgumentException(
					"REPLACE blocked for order " + preview.getExternalOrderId()
							+ " because an invoice already exists. Use MERGE or SKIP.");
		}
		if (preview.getExistingOrder() != null
				&& invoiceRepository.existsByOrder_Id(preview.getExistingOrder().getId())) {
			throw new IllegalArgumentException(
					"REPLACE blocked for order " + preview.getExternalOrderId()
							+ " because an invoice already exists. Use MERGE or SKIP.");
		}
	}

	private void savePreviewItems(OrderImportPreviewOrder preview, OrderSkuListExcelRow row) {
		Map<String, OrderItem> existingByKey = new HashMap<>();
		if (preview.getExistingOrder() != null) {
			for (OrderItem item : orderItemRepository.findByOrder_Id(preview.getExistingOrder().getId())) {
				existingByKey.put(lineKey(item.getPlatformSkuId(), item.getSku(), item.getVariation()), item);
			}
		}

		for (OrderSkuListLineItem line : row.lineItems()) {
			OrderImportPreviewItem item = new OrderImportPreviewItem();
			item.setPreviewOrder(preview);
			item.setPlatformSkuId(line.getPlatformSkuId());
			item.setSku(line.getSellerSku());
			item.setProductName(line.getProductName());
			item.setVariation(line.getVariation());
			item.setQuantity(line.getQuantity());
			item.setQuantityReturned(line.getQuantityReturned());
			item.setUnitPrice(line.getUnitPrice());
			item.setSubtotalBeforeDiscount(line.getSubtotalBeforeDiscount());
			item.setPlatformDiscount(line.getPlatformDiscount());
			item.setSellerDiscount(line.getSellerDiscount());
			item.setLineTotal(line.getLineTotal());
			item.setWeightKg(line.getWeightKg());
			item.setProductCategory(line.getProductCategory());
			item.setExcelRowIndex(line.getExcelRowIndex());
			item.setExcelRowJson(toExcelRowJson(line.getExcelColumns()));
			String key = lineKey(line.getPlatformSkuId(), line.getSellerSku(), line.getVariation());
			if (existingByKey.containsKey(key)) {
				item.setMergeHint("SAME_SKU_SUM_QTY");
			} else if (preview.getMatchStatus() == OrderImportMatchStatus.DUPLICATE) {
				item.setMergeHint("NEW_LINE");
			}
			previewItemRepository.save(item);
		}
	}

	private OrderSkuListExcelRow reconstructRow(OrderImportPreviewOrder preview) {
		OrderSkuListExcelRow row = new OrderSkuListExcelRow(preview.getExternalOrderId());
		if (StringUtils.hasText(preview.getHeaderJson())) {
			try {
				OrderImportHeaderSnapshot snap =
						MAPPER.readValue(preview.getHeaderJson(), OrderImportHeaderSnapshot.class);
				snap.applyTo(row);
			} catch (JsonProcessingException ex) {
				throw new IllegalStateException(
						"Corrupt preview header for order " + preview.getExternalOrderId(), ex);
			}
		}
		List<OrderImportPreviewItem> items =
				previewItemRepository.findByPreviewOrder_IdOrderByIdAsc(preview.getId());
		for (OrderImportPreviewItem item : items) {
			OrderSkuListLineItem line = new OrderSkuListLineItem();
			line.setPlatformSkuId(item.getPlatformSkuId());
			line.setSellerSku(item.getSku());
			line.setProductName(item.getProductName());
			line.setVariation(item.getVariation());
			line.setQuantity(item.getQuantity());
			line.setQuantityReturned(item.getQuantityReturned());
			line.setUnitPrice(item.getUnitPrice());
			line.setSubtotalBeforeDiscount(item.getSubtotalBeforeDiscount());
			line.setPlatformDiscount(item.getPlatformDiscount());
			line.setSellerDiscount(item.getSellerDiscount());
			line.setLineTotal(item.getLineTotal());
			line.setWeightKg(item.getWeightKg());
			line.setProductCategory(item.getProductCategory());
			row.lineItems().add(line);
		}
		return row;
	}

	private OrderImportPreviewBatchDto toBatchDto(OrderImportBatch batch) {
		OrderImportPreviewBatchDto dto = new OrderImportPreviewBatchDto();
		dto.setBatchId(batch.getId());
		dto.setStatus(batch.getStatus());
		dto.setSheetName(batch.getSheetName());
		dto.setOriginalFilename(batch.getOriginalFilename());
		dto.setRowCount(batch.getRowCount() != null ? batch.getRowCount() : 0);
		dto.setTotalOrders(batch.getTotalOrders() != null ? batch.getTotalOrders() : 0);
		dto.setNewCount(batch.getNewCount() != null ? batch.getNewCount() : 0);
		dto.setDuplicateCount(batch.getDuplicateCount() != null ? batch.getDuplicateCount() : 0);
		dto.setExpiresAt(batch.getExpiresAt() != null ? batch.getExpiresAt().toString() : null);

		List<OrderImportPreviewOrder> previews =
				previewOrderRepository.findByBatch_IdOrderByIdAsc(batch.getId());
		previews.sort((a, b) -> {
			boolean aDup = a.getMatchStatus() == OrderImportMatchStatus.DUPLICATE;
			boolean bDup = b.getMatchStatus() == OrderImportMatchStatus.DUPLICATE;
			if (aDup != bDup) {
				return aDup ? -1 : 1;
			}
			boolean aUnresolved = aDup && a.getResolveAction() == null;
			boolean bUnresolved = bDup && b.getResolveAction() == null;
			if (aUnresolved != bUnresolved) {
				return aUnresolved ? -1 : 1;
			}
			return Long.compare(
					a.getId() != null ? a.getId() : 0L,
					b.getId() != null ? b.getId() : 0L);
		});

		for (OrderImportPreviewOrder preview : previews) {
			OrderImportPreviewOrderDto row = new OrderImportPreviewOrderDto();
			row.setId(preview.getId());
			row.setExternalOrderId(preview.getExternalOrderId());
			row.setMatchStatus(preview.getMatchStatus());
			row.setExistingOrderId(
					preview.getExistingOrder() != null ? preview.getExistingOrder().getId() : null);
			row.setResolveAction(preview.getResolveAction());
			row.setResolveSource(preview.getResolveSource());
			row.setExcelItemCount(preview.getExcelItemCount());
			row.setExistingItemCount(preview.getExistingItemCount());
			row.setExcelTotalAmount(preview.getExcelTotalAmount());
			row.setExistingTotalAmount(preview.getExistingTotalAmount());
			row.setWarningCode(preview.getWarningCode());
			dto.getOrders().add(row);
		}
		return dto;
	}

	private OrderImportBatch requirePreviewBatch(Long storeId, Long batchId) {
		OrderImportBatch batch = batchRepository.findByIdAndStore_Id(batchId, storeId)
				.orElseThrow(() -> new IllegalArgumentException("Import preview batch not found: id=" + batchId));
		if (batch.getStatus() != OrderImportBatchStatus.PREVIEW) {
			throw new IllegalArgumentException("Import preview batch is not open: status=" + batch.getStatus());
		}
		if (batch.getExpiresAt() != null && batch.getExpiresAt().isBefore(Instant.now())) {
			batch.setStatus(OrderImportBatchStatus.EXPIRED);
			batchRepository.save(batch);
			throw new IllegalArgumentException("Import preview batch has expired");
		}
		return batch;
	}

	@Transactional
	public OrderImportPreviewExcelRowsDto getExcelRows(Long storeId, Long batchId, Long previewOrderId) {
		OrderImportBatch batch = requirePreviewBatch(storeId, batchId);
		OrderImportPreviewOrder preview = previewOrderRepository
				.findByIdAndBatch_Id(previewOrderId, batch.getId())
				.orElseThrow(() -> new IllegalArgumentException(
						"Import preview order not found: id=" + previewOrderId));

		List<OrderImportPreviewItem> items =
				previewItemRepository.findByPreviewOrder_IdOrderByExcelRowIndexAscIdAsc(preview.getId());

		OrderImportPreviewExcelRowsDto dto = new OrderImportPreviewExcelRowsDto();
		dto.setPreviewOrderId(preview.getId());
		dto.setExternalOrderId(preview.getExternalOrderId());

		LinkedHashSet<String> columnOrder = new LinkedHashSet<>();
		for (OrderImportPreviewItem item : items) {
			OrderImportPreviewExcelRowsDto.OrderImportPreviewExcelRowDto rowDto =
					new OrderImportPreviewExcelRowsDto.OrderImportPreviewExcelRowDto();
			rowDto.setExcelRowIndex(item.getExcelRowIndex());
			Map<String, String> values = parseExcelRowJson(item.getExcelRowJson());
			if (values.isEmpty()) {
				values = fallbackExcelColumns(item, preview.getExternalOrderId());
			}
			rowDto.setValues(values);
			columnOrder.addAll(values.keySet());
			dto.getRows().add(rowDto);
		}
		dto.getColumns().addAll(columnOrder);
		return dto;
	}

	private Store requireStore(Long storeId) {
		return storeRepository.findById(storeId)
				.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + storeId));
	}

	private Marketplace requireMarketplace(String marketplaceCode) {
		return marketplaceRepository.findByCodeIgnoreCase(marketplaceCode)
				.orElseThrow(() -> new IllegalArgumentException("Marketplace not found: code=" + marketplaceCode));
	}

	private static String toHeaderJson(OrderSkuListExcelRow row) {
		try {
			return MAPPER.writeValueAsString(OrderImportHeaderSnapshot.fromRow(row));
		} catch (JsonProcessingException ex) {
			throw new IllegalStateException("Failed to serialize import header", ex);
		}
	}

	private static String toExcelRowJson(Map<String, String> columns) {
		if (columns == null || columns.isEmpty()) {
			return null;
		}
		try {
			return MAPPER.writeValueAsString(columns);
		} catch (JsonProcessingException ex) {
			throw new IllegalStateException("Failed to serialize Excel row columns", ex);
		}
	}

	@SuppressWarnings("unchecked")
	private static Map<String, String> parseExcelRowJson(String json) {
		if (!StringUtils.hasText(json)) {
			return new LinkedHashMap<>();
		}
		try {
			Map<String, Object> raw = MAPPER.readValue(json, Map.class);
			Map<String, String> values = new LinkedHashMap<>();
			for (Map.Entry<String, Object> entry : raw.entrySet()) {
				values.put(entry.getKey(), entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
			}
			return values;
		} catch (JsonProcessingException ex) {
			return new LinkedHashMap<>();
		}
	}

	private static Map<String, String> fallbackExcelColumns(OrderImportPreviewItem item, String orderId) {
		Map<String, String> values = new LinkedHashMap<>();
		values.put("Order ID", orderId == null ? "" : orderId);
		values.put("SKU ID", nullToEmpty(item.getPlatformSkuId()));
		values.put("Seller SKU", nullToEmpty(item.getSku()));
		values.put("Product Name", nullToEmpty(item.getProductName()));
		values.put("Variation", nullToEmpty(item.getVariation()));
		values.put("Quantity", item.getQuantity() == null ? "" : String.valueOf(item.getQuantity()));
		values.put(
				"Sku Quantity of return",
				item.getQuantityReturned() == null ? "" : String.valueOf(item.getQuantityReturned()));
		values.put("SKU Unit Original Price", decimalToString(item.getUnitPrice()));
		values.put("SKU Subtotal Before Discount", decimalToString(item.getSubtotalBeforeDiscount()));
		values.put("SKU Platform Discount", decimalToString(item.getPlatformDiscount()));
		values.put("SKU Seller Discount", decimalToString(item.getSellerDiscount()));
		values.put("SKU Subtotal After Discount", decimalToString(item.getLineTotal()));
		values.put("Weight(kg)", decimalToString(item.getWeightKg()));
		values.put("Product Category", nullToEmpty(item.getProductCategory()));
		return values;
	}

	private static String nullToEmpty(String value) {
		return value == null ? "" : value;
	}

	private static String decimalToString(BigDecimal value) {
		return value == null ? "" : value.toPlainString();
	}

	static String lineKey(String platformSkuId, String sku, String variation) {
		String idPart = StringUtils.hasText(platformSkuId)
				? platformSkuId.trim()
				: (sku == null ? "" : sku.trim());
		String varPart = variation == null ? "" : variation.trim();
		return idPart + "\0" + varPart;
	}

	static BigDecimal nullSafeAdd(BigDecimal a, BigDecimal b) {
		if (a == null) {
			return b;
		}
		if (b == null) {
			return a;
		}
		return a.add(b);
	}

	static int nullSafeInt(Integer value) {
		return value == null ? 0 : value;
	}

	static <T> T prefer(T excel, T existing) {
		if (excel instanceof String s) {
			return StringUtils.hasText(s) ? excel : existing;
		}
		return excel != null ? excel : existing;
	}

	static boolean sameKey(OrderItem item, OrderSkuListLineItem line) {
		return Objects.equals(
				lineKey(item.getPlatformSkuId(), item.getSku(), item.getVariation()),
				lineKey(line.getPlatformSkuId(), line.getSellerSku(), line.getVariation()));
	}
}
