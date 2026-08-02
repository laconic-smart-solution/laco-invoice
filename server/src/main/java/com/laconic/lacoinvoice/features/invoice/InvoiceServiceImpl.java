package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.export.ExcelExportWriter;
import com.laconic.lacoinvoice.common.export.ExportColumnSelector;
import com.laconic.lacoinvoice.common.export.ExportPreviewPaging;
import com.laconic.lacoinvoice.common.export.ZipExportWriter;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.pagination.SpecQuerySupport;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.InvoiceStatus;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.features.invoice.pageable.InvoicePageRequest;
import com.laconic.lacoinvoice.features.order.OrderExportRequest;

@Service
public class InvoiceServiceImpl implements InvoiceService {

	private static final int DEFAULT_VAT_PERCENTAGE = 7;
	private static final int MAX_EXPORT_ROWS = 10_000;
	private static final int MAX_BULK_PDF = 100;
	private static final DateTimeFormatter INVOICE_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyyMM");
	private static final DateTimeFormatter EXPORT_DATE = DateTimeFormatter.BASIC_ISO_DATE;
	private static final Map<String, String> INVOICE_FILTER_FIELD_PATHS = Map.of(
			"storeId", "order.store.id",
			"orderId", "order.id");
	private static final Map<String, String> ORDER_FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"marketplaceId", "marketplace.id",
			"marketplaceCode", "marketplace.code");

	private static final LinkedHashMap<String, ExportColumnSelector.ColumnDef<InvoiceListItemDto>> EXPORT_COLUMNS =
			createExportColumns();

	private static LinkedHashMap<String, ExportColumnSelector.ColumnDef<InvoiceListItemDto>> createExportColumns() {
		LinkedHashMap<String, ExportColumnSelector.ColumnDef<InvoiceListItemDto>> columns = new LinkedHashMap<>();
		columns.put("invoiceNo", new ExportColumnSelector.ColumnDef<>("Invoice No", InvoiceListItemDto::invoiceNo));
		columns.put("orderId", new ExportColumnSelector.ColumnDef<>("Order ID", InvoiceListItemDto::orderId));
		columns.put("storeName", new ExportColumnSelector.ColumnDef<>("Store", InvoiceListItemDto::storeName));
		columns.put("marketplaceCode", new ExportColumnSelector.ColumnDef<>("Marketplace", InvoiceListItemDto::marketplaceCode));
		columns.put("customerName", new ExportColumnSelector.ColumnDef<>("Customer", InvoiceListItemDto::customerName));
		columns.put("grandTotal", new ExportColumnSelector.ColumnDef<>("Grand Total", InvoiceListItemDto::grandTotal));
		columns.put("currency", new ExportColumnSelector.ColumnDef<>("Currency", InvoiceListItemDto::currency));
		columns.put("vatPercentage", new ExportColumnSelector.ColumnDef<>("VAT %", InvoiceListItemDto::vatPercentage));
		columns.put("status", new ExportColumnSelector.ColumnDef<>("Status", InvoiceListItemDto::status));
		columns.put("issuedAt", new ExportColumnSelector.ColumnDef<>("Issued At", InvoiceListItemDto::issuedAt));
		return columns;
	}

	private final InvoiceRepository invoiceRepository;
	private final OrderRepository orderRepository;
	private final InvoiceMapper mapper;
	private final InvoicePdfService invoicePdfService;

	public InvoiceServiceImpl(
			InvoiceRepository invoiceRepository,
			OrderRepository orderRepository,
			InvoiceMapper mapper,
			InvoicePdfService invoicePdfService) {
		this.invoiceRepository = invoiceRepository;
		this.orderRepository = orderRepository;
		this.mapper = mapper;
		this.invoicePdfService = invoicePdfService;
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceDto generateForOrder(Long orderId) {
		Order order = orderRepository.findDetailById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found: id=" + orderId));

		if (invoiceRepository.existsByOrder_Id(orderId)) {
			throw new ResourceConflictException("Invoice already exists for order id=" + orderId);
		}

		BigDecimal subtotal = nullToZero(order.getSubtotal());
		BigDecimal shippingFee = nullToZero(order.getShippingFee());
		BigDecimal taxable = subtotal.add(shippingFee);
		BigDecimal vatAmount = taxable
				.multiply(BigDecimal.valueOf(DEFAULT_VAT_PERCENTAGE))
				.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
		BigDecimal grandTotal = taxable.add(vatAmount);

		Invoice invoice = new Invoice();
		invoice.setOrder(order);
		invoice.setInvoiceNo(nextInvoiceNumber());
		invoice.setSubtotal(subtotal);
		invoice.setVatAmount(vatAmount);
		invoice.setVatPercentage(DEFAULT_VAT_PERCENTAGE);
		invoice.setGrandTotal(grandTotal);
		invoice.setStatus(InvoiceStatus.ISSUED);
		invoice.setIssuedAt(Instant.now());

		Invoice saved = invoiceRepository.save(invoice);
		saved.setPdfUrl("/api/v1/invoices/" + saved.getId() + "/pdf");
		return mapper.toDto(invoiceRepository.save(saved));
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceDetailDto getDetailById(Long id) {
		Invoice invoice = invoiceRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + id));
		return toDetailDto(invoice);
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<InvoiceListItemDto>> page(InvoicePageRequest request) {
		ApiResponse<List<InvoiceDto>> response = PageQuerySupport.queryWithMap(
				invoiceRepository,
				mapper,
				request.toPageAndFilter(),
				Invoice.class,
				ObjectMapUtils.toMap(request.getFilter(), INVOICE_FILTER_FIELD_PATHS),
				null);

		List<InvoiceDto> data = response.getData();
		if (data == null || data.isEmpty()) {
			return ApiResponse.ok(response.getMessage(), List.of(), response.getMeta());
		}

		List<Long> ids = data.stream().map(InvoiceDto::id).toList();
		List<InvoiceListItemDto> items = invoiceRepository.findAllDetailedByIdIn(ids).stream()
				.map(mapper::toListItemDto)
				.toList();
		// Preserve page order
		java.util.Map<Long, InvoiceListItemDto> byId = items.stream()
				.collect(java.util.stream.Collectors.toMap(InvoiceListItemDto::id, item -> item, (a, b) -> a));
		List<InvoiceListItemDto> ordered = ids.stream()
				.map(byId::get)
				.filter(java.util.Objects::nonNull)
				.toList();
		return ApiResponse.ok(response.getMessage(), ordered, response.getMeta());
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceStatsDto stats(Long storeId) {
		long issuedCount = invoiceRepository.countByStatusAndOptionalStoreId(InvoiceStatus.ISSUED, storeId);
		long voidedCount = invoiceRepository.countByStatusAndOptionalStoreId(InvoiceStatus.VOID, storeId);
		BigDecimal issuedGrandTotal = invoiceRepository.sumGrandTotalByStatusAndOptionalStoreId(
				InvoiceStatus.ISSUED,
				storeId);
		return new InvoiceStatsDto(
				issuedCount,
				voidedCount,
				issuedGrandTotal != null ? issuedGrandTotal : BigDecimal.ZERO);
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isManagerOrAdmin()")
	public InvoiceDto voidInvoice(Long id) {
		Invoice invoice = invoiceRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + id));
		if (invoice.getStatus() == InvoiceStatus.VOID) {
			throw new BusinessRuleException("Invoice is already void.");
		}
		invoice.setStatus(InvoiceStatus.VOID);
		return mapper.toDto(invoiceRepository.save(invoice));
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] renderPdf(Long id) {
		Invoice invoice = invoiceRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + id));
		return invoicePdfService.renderPdf(toDetailDto(invoice));
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public String pdfFilename(Long id) {
		Invoice invoice = invoiceRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + id));
		return sanitizeFilename(invoice.getInvoiceNo(), id) + ".pdf";
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportExcel(InvoiceExportRequest request) {
		List<InvoiceListItemDto> invoices = resolveInvoicesForExport(request, MAX_EXPORT_ROWS);
		if (invoices.isEmpty()) {
			throw new BusinessRuleException("No invoices found to export.");
		}

		ExportColumnSelector.SelectedColumns<InvoiceListItemDto> columns =
				ExportColumnSelector.select(EXPORT_COLUMNS, request.getColumns());
		return ExcelExportWriter.write(
				"Invoices",
				columns.headers(),
				ExportColumnSelector.mapRows(columns, invoices));
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public String exportFilename() {
		return "invoices-export-" + LocalDate.now().format(EXPORT_DATE) + ".xlsx";
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<InvoiceListItemDto>> exportPreview(InvoiceExportRequest request) {
		int pageNumber = request.getPageNumber() != null ? request.getPageNumber() : 1;
		int pageSize = request.getPageSize() != null ? request.getPageSize() : 10;

		List<Long> allIds = resolveInvoiceIdsForExport(request, MAX_EXPORT_ROWS);
		if (allIds.isEmpty()) {
			return ExportPreviewPaging.empty(pageNumber, pageSize);
		}

		List<Long> pageIds = ExportPreviewPaging.pageIds(allIds, pageNumber, pageSize);
		if (pageIds.isEmpty()) {
			return ApiResponse.ok("OK", List.of(), ExportPreviewPaging.meta(pageNumber, pageSize, allIds.size()));
		}

		Map<Long, InvoiceListItemDto> byId = invoiceRepository.findAllDetailedByIdIn(pageIds).stream()
				.map(mapper::toListItemDto)
				.collect(java.util.stream.Collectors.toMap(InvoiceListItemDto::id, item -> item, (a, b) -> a));
		List<InvoiceListItemDto> ordered = pageIds.stream()
				.map(byId::get)
				.filter(Objects::nonNull)
				.toList();
		PageMeta meta = ExportPreviewPaging.meta(pageNumber, pageSize, allIds.size());
		return ApiResponse.ok("OK", ordered, meta);
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] bulkPdfZip(InvoiceExportRequest request) {
		List<InvoiceListItemDto> invoices = resolveInvoicesForExport(request, MAX_BULK_PDF);
		if (invoices.isEmpty()) {
			throw new BusinessRuleException("No invoices found to download.");
		}

		List<ZipExportWriter.ZipFileEntry> entries = new ArrayList<>(invoices.size());
		for (InvoiceListItemDto item : invoices) {
			Invoice invoice = invoiceRepository.findDetailById(item.id())
					.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + item.id()));
			byte[] pdf = invoicePdfService.renderPdf(toDetailDto(invoice));
			String filename = sanitizeFilename(invoice.getInvoiceNo(), invoice.getId()) + ".pdf";
			entries.add(new ZipExportWriter.ZipFileEntry(filename, pdf));
		}
		return ZipExportWriter.write(entries);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public String bulkPdfZipFilename() {
		return "invoices-pdf-" + LocalDate.now().format(EXPORT_DATE) + ".zip";
	}

	@Override
	@Transactional
	public OrderInvoicePdf buildPdfForOrder(Long orderId) {
		Invoice invoice = ensureInvoiceForOrder(orderId);
		Invoice detailed = invoiceRepository.findDetailById(invoice.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + invoice.getId()));
		byte[] pdf = invoicePdfService.renderPdf(toDetailDto(detailed));
		String filename = sanitizeFilename(detailed.getInvoiceNo(), detailed.getId()) + ".pdf";
		return new OrderInvoicePdf(filename, pdf);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Long> resolveOrderIdsForBulkGenerate(OrderExportRequest request, int maxRows) {
		return resolveOrderIdsForBulkGenerateInternal(request, maxRows);
	}

	private Invoice ensureInvoiceForOrder(Long orderId) {
		return invoiceRepository.findByOrder_Id(orderId)
				.orElseGet(() -> {
					InvoiceDto created = generateForOrder(orderId);
					return invoiceRepository.findById(created.id())
							.orElseThrow(() -> new ResourceNotFoundException(
									"Invoice not found after generate: id=" + created.id()));
				});
	}

	private List<Long> resolveOrderIdsForBulkGenerateInternal(OrderExportRequest request, int maxRows) {
		if (request == null) {
			throw new BusinessRuleException("Bulk generate request is required.");
		}

		List<Long> ids = request.getIds() == null
				? List.of()
				: request.getIds().stream().filter(Objects::nonNull).distinct().toList();

		if (!ids.isEmpty()) {
			if (ids.size() > maxRows) {
				throw new BusinessRuleException(
						"Bulk generate is limited to " + maxRows
								+ " orders. Narrow your selection.");
			}
			return ids;
		}

		if (request.isExportAll()) {
			return SpecQuerySupport.findAll(
					orderRepository,
					Order.class,
					request.getFilter(),
					ORDER_FILTER_FIELD_PATHS,
					maxRows,
					"Bulk generate is limited to " + maxRows
							+ " orders. Apply filters to reduce the set.")
					.stream()
					.map(Order::getId)
					.filter(Objects::nonNull)
					.toList();
		}

		throw new BusinessRuleException("Select orders to generate, or confirm generate all.");
	}

	private List<InvoiceListItemDto> resolveInvoicesForExport(InvoiceExportRequest request, int maxRows) {
		List<Long> resolvedIds = resolveInvoiceIdsForExport(request, maxRows);
		if (resolvedIds.isEmpty()) {
			return List.of();
		}

		Map<Long, InvoiceListItemDto> byId = invoiceRepository.findAllDetailedByIdIn(resolvedIds).stream()
				.map(mapper::toListItemDto)
				.collect(java.util.stream.Collectors.toMap(InvoiceListItemDto::id, item -> item, (a, b) -> a));
		return resolvedIds.stream()
				.map(byId::get)
				.filter(Objects::nonNull)
				.toList();
	}

	private List<Long> resolveInvoiceIdsForExport(InvoiceExportRequest request, int maxRows) {
		if (request == null) {
			throw new BusinessRuleException("Export request is required.");
		}

		List<Long> ids = request.getIds() == null
				? List.of()
				: request.getIds().stream().filter(Objects::nonNull).distinct().toList();

		if (!ids.isEmpty()) {
			if (ids.size() > maxRows) {
				throw new BusinessRuleException(
						"This action is limited to " + maxRows + " invoices. Narrow your selection.");
			}
			return ids;
		}

		if (request.isExportAll()) {
			List<Invoice> entities = SpecQuerySupport.findAllWithMap(
					invoiceRepository,
					Invoice.class,
					ObjectMapUtils.toMap(request.getFilter(), INVOICE_FILTER_FIELD_PATHS),
					maxRows,
					"This action is limited to " + maxRows + " invoices. Apply filters to reduce the set.");
			return entities.stream().map(Invoice::getId).filter(Objects::nonNull).toList();
		}

		throw new BusinessRuleException("Select invoices first, or confirm export all.");
	}

	private static String sanitizeFilename(String invoiceNo, Long id) {
		String no = invoiceNo != null && !invoiceNo.isBlank() ? invoiceNo : ("invoice-" + id);
		return no.replaceAll("[^A-Za-z0-9._-]", "_");
	}

	private InvoiceDetailDto toDetailDto(Invoice invoice) {
		Order order = invoice.getOrder();
		Long storeId = order != null && order.getStore() != null ? order.getStore().getId() : null;
		String storeName = order != null && order.getStore() != null ? order.getStore().getName() : null;
		String marketplaceCode = order != null && order.getMarketplace() != null
				? order.getMarketplace().getCode()
				: null;
		String externalOrderId = order != null ? order.getExternalOrderId() : null;
		String currency = order != null ? order.getCurrency() : null;
		BigDecimal shippingFee = order != null ? nullToZero(order.getShippingFee()) : BigDecimal.ZERO;

		CustomerInfo customer = order != null ? order.getCustomer() : null;
		String customerName = customer != null ? customer.getName() : null;
		String customerEmail = customer != null ? customer.getEmail() : null;
		String customerPhone = customer != null ? customer.getPhone() : null;
		String customerAddress = customer != null ? customer.getAddress() : null;

		List<InvoiceLineItemDto> items = List.of();
		if (order != null && order.getId() != null) {
			items = orderRepository.findItemsByOrderId(order.getId()).stream()
					.map(mapper::toLineItemDto)
					.toList();
		}

		return new InvoiceDetailDto(
				mapper.toDto(invoice),
				storeId,
				storeName,
				marketplaceCode,
				externalOrderId,
				currency,
				shippingFee,
				customerName,
				customerEmail,
				customerPhone,
				customerAddress,
				items);
	}

	private String nextInvoiceNumber() {
		String prefix = "INV-" + YearMonth.now(ZoneId.systemDefault()).format(INVOICE_MONTH_FORMAT) + "-";
		int nextSequence = invoiceRepository.findTopByInvoiceNoStartingWithOrderByInvoiceNoDesc(prefix)
				.map(existing -> parseSequence(existing.getInvoiceNo(), prefix) + 1)
				.orElse(1);
		return prefix + String.format("%06d", nextSequence);
	}

	private static int parseSequence(String invoiceNo, String prefix) {
		if (invoiceNo == null || !invoiceNo.startsWith(prefix)) {
			return 0;
		}
		try {
			return Integer.parseInt(invoiceNo.substring(prefix.length()));
		} catch (NumberFormatException ex) {
			return 0;
		}
	}

	private static BigDecimal nullToZero(BigDecimal value) {
		return value != null ? value : BigDecimal.ZERO;
	}
}
