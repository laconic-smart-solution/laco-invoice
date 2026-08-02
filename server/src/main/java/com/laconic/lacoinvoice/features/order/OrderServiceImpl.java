package com.laconic.lacoinvoice.features.order;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.export.ExcelExportWriter;
import com.laconic.lacoinvoice.common.export.ExportColumnSelector;
import com.laconic.lacoinvoice.common.export.ExportPreviewPaging;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.pagination.SpecQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.order.pageable.OrderPageRequest;

@Service
public class OrderServiceImpl implements OrderService {

	private static final int MAX_EXPORT_ROWS = 10_000;
	private static final DateTimeFormatter EXPORT_DATE = DateTimeFormatter.BASIC_ISO_DATE;

	private static final Map<String, String> ORDER_FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"marketplaceId", "marketplace.id",
			"marketplaceCode", "marketplace.code");

	private static final LinkedHashMap<String, ExportColumnSelector.ColumnDef<OrderDto>> EXPORT_COLUMNS =
			createExportColumns();

	private static LinkedHashMap<String, ExportColumnSelector.ColumnDef<OrderDto>> createExportColumns() {
		LinkedHashMap<String, ExportColumnSelector.ColumnDef<OrderDto>> columns = new LinkedHashMap<>();
		columns.put("id", new ExportColumnSelector.ColumnDef<>("Order ID", OrderDto::id));
		columns.put("externalOrderId", new ExportColumnSelector.ColumnDef<>("External Order ID", OrderDto::externalOrderId));
		columns.put("storeName", new ExportColumnSelector.ColumnDef<>("Store", OrderDto::storeName));
		columns.put("marketplaceCode", new ExportColumnSelector.ColumnDef<>("Marketplace", OrderDto::marketplaceCode));
		columns.put("customerName", new ExportColumnSelector.ColumnDef<>("Customer", OrderDto::customerName));
		columns.put("customerPhone", new ExportColumnSelector.ColumnDef<>("Customer Phone", OrderDto::customerPhone));
		columns.put("invoiceId", new ExportColumnSelector.ColumnDef<>("Invoice ID", OrderDto::invoiceId));
		columns.put("orderStatus", new ExportColumnSelector.ColumnDef<>("Status", OrderDto::orderStatus));
		columns.put("sourceType", new ExportColumnSelector.ColumnDef<>("Source", OrderDto::sourceType));
		columns.put("subtotal", new ExportColumnSelector.ColumnDef<>("Subtotal", OrderDto::subtotal));
		columns.put("shippingFee", new ExportColumnSelector.ColumnDef<>("Shipping Fee", OrderDto::shippingFee));
		columns.put("amountExVat", new ExportColumnSelector.ColumnDef<>("EX.VAT", OrderDto::amountExVat));
		columns.put("vatAmount", new ExportColumnSelector.ColumnDef<>("VAT", OrderDto::vatAmount));
		columns.put("totalAmount", new ExportColumnSelector.ColumnDef<>("Total", OrderDto::totalAmount));
		columns.put("currency", new ExportColumnSelector.ColumnDef<>("Currency", OrderDto::currency));
		columns.put("orderDate", new ExportColumnSelector.ColumnDef<>("Order Date", OrderDto::orderDate));
		columns.put("createdAt", new ExportColumnSelector.ColumnDef<>("Created At", OrderDto::createdAt));
		return columns;
	}

	private final OrderRepository orderRepository;
	private final StoreRepository storeRepository;
	private final InvoiceRepository invoiceRepository;
	private final OrderMapper mapper;
	private final OrderSyncService orderSyncService;

	public OrderServiceImpl(
			OrderRepository orderRepository,
			StoreRepository storeRepository,
			InvoiceRepository invoiceRepository,
			OrderMapper mapper,
			OrderSyncService orderSyncService) {
		this.orderRepository = orderRepository;
		this.storeRepository = storeRepository;
		this.invoiceRepository = invoiceRepository;
		this.mapper = mapper;
		this.orderSyncService = orderSyncService;
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<OrderDto>> page(OrderPageRequest request) {
		ApiResponse<List<OrderDto>> response = PageQuerySupport.query(
				orderRepository,
				mapper,
				request.toPageAndFilter(),
				Order.class,
				request.getFilter(),
				ORDER_FILTER_FIELD_PATHS);
		List<OrderDto> data = response.getData();
		if (data == null || data.isEmpty()) {
			return response;
		}
		List<Long> orderIds = data.stream().map(OrderDto::id).filter(Objects::nonNull).toList();
		Map<Long, Long> invoiceIdByOrderId = invoiceRepository.findByOrder_IdIn(orderIds).stream()
				.filter(invoice -> invoice.getOrder() != null && invoice.getOrder().getId() != null)
				.collect(Collectors.toMap(
						invoice -> invoice.getOrder().getId(),
						Invoice::getId,
						(a, b) -> a));
		List<OrderDto> enriched = data.stream()
				.map(dto -> new OrderDto(
						dto.id(),
						dto.storeId(),
						dto.storeName(),
						dto.marketplaceId(),
						dto.marketplaceCode(),
						dto.customerId(),
						dto.customerName(),
						dto.customerPhone(),
						invoiceIdByOrderId.get(dto.id()),
						dto.externalOrderId(),
						dto.orderStatus(),
						dto.sourceType(),
						dto.subtotal(),
						dto.shippingFee(),
						dto.amountExVat(),
						dto.vatAmount(),
						dto.totalAmount(),
						dto.currency(),
						dto.orderDate(),
						dto.createdAt()))
				.toList();
		return ApiResponse.ok(response.getMessage(), enriched, response.getMeta());
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderDetailDto getDetailById(Long id) {
		Order order = orderRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found: id=" + id));
		Long invoiceId = invoiceRepository.findByOrder_Id(id).map(Invoice::getId).orElse(null);
		List<OrderItemDto> items = orderRepository.findItemsByOrderId(id).stream()
				.map(mapper::toItemDto)
				.toList();
		return new OrderDetailDto(
				mapper.toDto(order, invoiceId),
				mapper.toCustomerDto(order.getCustomer()),
				items);
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderStatsDto stats(Long storeId) {
		long totalOrders = orderRepository.countByOptionalStoreId(storeId);
		long invoicedOrders = orderRepository.countInvoicedByOptionalStoreId(storeId);
		long awaitingInvoice = orderRepository.countAwaitingInvoiceByOptionalStoreId(storeId);
		double invoiceCoveragePercent = totalOrders > 0
				? (invoicedOrders * 100.0) / totalOrders
				: 0.0;
		return new OrderStatsDto(totalOrders, invoicedOrders, awaitingInvoice, invoiceCoveragePercent);
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void triggerSync() {
		storeRepository.findByActiveTrue()
				.forEach(store -> orderSyncService.ingestOrders(store.getId()));
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportExcel(OrderExportRequest request) {
		List<OrderDto> orders = resolveOrdersForExport(request);
		if (orders.isEmpty()) {
			throw new BusinessRuleException("No orders found to export.");
		}

		ExportColumnSelector.SelectedColumns<OrderDto> columns =
				ExportColumnSelector.select(EXPORT_COLUMNS, request.getColumns());
		return ExcelExportWriter.write(
				"Orders",
				columns.headers(),
				ExportColumnSelector.mapRows(columns, orders));
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public String exportFilename() {
		return "orders-export-" + LocalDate.now().format(EXPORT_DATE) + ".xlsx";
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<OrderDto>> exportPreview(OrderExportRequest request) {
		int pageNumber = request.getPageNumber() != null ? request.getPageNumber() : 1;
		int pageSize = request.getPageSize() != null ? request.getPageSize() : 10;

		List<Long> allIds = resolveOrderIdsForExport(request);
		if (allIds.isEmpty()) {
			return ExportPreviewPaging.empty(pageNumber, pageSize);
		}

		List<Long> pageIds = ExportPreviewPaging.pageIds(allIds, pageNumber, pageSize);
		if (pageIds.isEmpty()) {
			return ApiResponse.ok("OK", List.of(), ExportPreviewPaging.meta(pageNumber, pageSize, allIds.size()));
		}

		List<Order> entities = orderRepository.findAllById(pageIds);
		Map<Long, Order> byId = entities.stream()
				.filter(order -> order.getId() != null)
				.collect(Collectors.toMap(Order::getId, order -> order, (a, b) -> a));
		Map<Long, Long> invoiceIdByOrderId = invoiceRepository.findByOrder_IdIn(pageIds).stream()
				.filter(invoice -> invoice.getOrder() != null && invoice.getOrder().getId() != null)
				.collect(Collectors.toMap(
						invoice -> invoice.getOrder().getId(),
						Invoice::getId,
						(a, b) -> a));

		List<OrderDto> ordered = pageIds.stream()
				.map(byId::get)
				.filter(Objects::nonNull)
				.map(order -> mapper.toDto(order, invoiceIdByOrderId.get(order.getId())))
				.toList();
		PageMeta meta = ExportPreviewPaging.meta(pageNumber, pageSize, allIds.size());
		return ApiResponse.ok("OK", ordered, meta);
	}

	private List<OrderDto> resolveOrdersForExport(OrderExportRequest request) {
		List<Long> orderIds = resolveOrderIdsForExport(request);
		if (orderIds.isEmpty()) {
			return List.of();
		}

		List<Order> entities = orderRepository.findAllById(orderIds);
		Map<Long, Order> byId = entities.stream()
				.filter(order -> order.getId() != null)
				.collect(Collectors.toMap(Order::getId, order -> order, (a, b) -> a));
		Map<Long, Long> invoiceIdByOrderId = invoiceRepository.findByOrder_IdIn(orderIds).stream()
				.filter(invoice -> invoice.getOrder() != null && invoice.getOrder().getId() != null)
				.collect(Collectors.toMap(
						invoice -> invoice.getOrder().getId(),
						Invoice::getId,
						(a, b) -> a));

		return orderIds.stream()
				.map(byId::get)
				.filter(Objects::nonNull)
				.map(order -> mapper.toDto(order, invoiceIdByOrderId.get(order.getId())))
				.toList();
	}

	private List<Long> resolveOrderIdsForExport(OrderExportRequest request) {
		if (request == null) {
			throw new BusinessRuleException("Export request is required.");
		}

		List<Long> ids = request.getIds() == null
				? List.of()
				: request.getIds().stream().filter(Objects::nonNull).distinct().toList();

		if (!ids.isEmpty()) {
			if (ids.size() > MAX_EXPORT_ROWS) {
				throw new BusinessRuleException(
						"Export is limited to " + MAX_EXPORT_ROWS + " orders. Narrow your selection.");
			}
			return ids;
		}

		if (request.isExportAll()) {
			return SpecQuerySupport.findAll(
					orderRepository,
					Order.class,
					request.getFilter(),
					ORDER_FILTER_FIELD_PATHS,
					MAX_EXPORT_ROWS,
					"Export is limited to " + MAX_EXPORT_ROWS + " orders. Apply filters to reduce the set.")
					.stream()
					.map(Order::getId)
					.filter(Objects::nonNull)
					.toList();
		}

		throw new BusinessRuleException("Select orders to export, or confirm export all.");
	}
}
