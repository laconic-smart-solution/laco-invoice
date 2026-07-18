package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.InvoiceStatus;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.features.invoice.pageable.InvoicePageRequest;

@Service
public class InvoiceServiceImpl implements InvoiceService {

	private static final int DEFAULT_VAT_PERCENTAGE = 7;
	private static final DateTimeFormatter INVOICE_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyyMM");

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
				com.laconic.lacoinvoice.common.util.ObjectMapUtils.toMap(request.getFilter()),
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
		String no = invoice.getInvoiceNo() != null ? invoice.getInvoiceNo() : ("invoice-" + id);
		return no.replaceAll("[^A-Za-z0-9._-]", "_") + ".pdf";
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
