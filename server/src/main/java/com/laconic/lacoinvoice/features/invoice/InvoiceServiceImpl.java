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
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.web.ApiResponse;
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

		BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
		BigDecimal vatAmount = subtotal.multiply(BigDecimal.valueOf(DEFAULT_VAT_PERCENTAGE))
				.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
		BigDecimal grandTotal = subtotal.add(vatAmount);

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
		saved.setPdfUrl(invoicePdfService.renderAndStore(saved));
		return mapper.toDto(invoiceRepository.save(saved));
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceDetailDto getDetailById(Long id) {
		Invoice invoice = invoiceRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + id));

		Long storeId = invoice.getOrder().getStore() != null ? invoice.getOrder().getStore().getId() : null;
		String externalOrderId = invoice.getOrder().getExternalOrderId();
		return new InvoiceDetailDto(mapper.toDto(invoice), storeId, externalOrderId);
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
				ObjectMapUtils.toMap(request.getFilter()),
				null);

		List<InvoiceListItemDto> items = response.getData().stream()
				.map(dto -> new InvoiceListItemDto(
						dto.id(),
						dto.orderId(),
						dto.invoiceNo(),
						dto.grandTotal(),
						dto.status(),
						dto.issuedAt()))
				.toList();
		return ApiResponse.ok(response.getMessage(), items, response.getMeta());
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
	public String getPdfUrl(Long id) {
		Invoice invoice = invoiceRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + id));
		return invoice.getPdfUrl() != null
				? invoice.getPdfUrl()
				: "/api/v1/invoices/" + id + "/pdf";
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
}
