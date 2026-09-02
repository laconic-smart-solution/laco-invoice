package com.laconic.lacoinvoice.features.paymentvoucher;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.PaymentVoucher;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.VoucherOrderAllocation;
import com.laconic.lacoinvoice.domain.models.VoucherStatus;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.PaymentVoucherRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.domain.repositories.VoucherOrderAllocationRepository;
import com.laconic.lacoinvoice.features.invoice.dto.GeneratedNumberDto;
import com.laconic.lacoinvoice.features.paymentvoucher.dto.PaymentVoucherCreateRequest;
import com.laconic.lacoinvoice.features.paymentvoucher.dto.PaymentVoucherCreateRequest.AllocationRequest;
import com.laconic.lacoinvoice.features.paymentvoucher.dto.PaymentVoucherDto;
import com.laconic.lacoinvoice.features.paymentvoucher.pageable.PaymentVoucherPageRequest;

@Service
public class PaymentVoucherService {

	private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Bangkok");

	private static final Map<String, String> FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"voucherNumber", "voucherNumber",
			"customerName", "customerName",
			"paymentMethod", "paymentMethod",
			"status", "status");

	private final PaymentVoucherRepository voucherRepository;
	private final VoucherOrderAllocationRepository allocationRepository;
	private final OrderRepository orderRepository;
	private final InvoiceRepository invoiceRepository;
	private final StoreRepository storeRepository;
	private final PaymentVoucherMapper mapper;

	public PaymentVoucherService(
			PaymentVoucherRepository voucherRepository,
			VoucherOrderAllocationRepository allocationRepository,
			OrderRepository orderRepository,
			InvoiceRepository invoiceRepository,
			StoreRepository storeRepository,
			PaymentVoucherMapper mapper) {
		this.voucherRepository = voucherRepository;
		this.allocationRepository = allocationRepository;
		this.orderRepository = orderRepository;
		this.invoiceRepository = invoiceRepository;
		this.storeRepository = storeRepository;
		this.mapper = mapper;
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<PaymentVoucherDto>> page(PaymentVoucherPageRequest request) {
		return PageQuerySupport.query(
				voucherRepository,
				mapper,
				request.toPageAndFilter(),
				PaymentVoucher.class,
				request.getFilter(),
				FILTER_FIELD_PATHS);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public PaymentVoucherDto getById(Long id) {
		return mapper.toDto(requireVoucher(id));
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<PaymentVoucherDto> listByInvoice(Long invoiceId) {
		return voucherRepository.findByInvoiceId(invoiceId).stream().map(mapper::toDto).toList();
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public GeneratedNumberDto nextNumber() {
		return new GeneratedNumberDto(generateNextNumber(), true);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public GeneratedNumberDto checkNumber(String voucherNumber, Long excludeId) {
		String trimmed = voucherNumber == null ? "" : voucherNumber.trim();
		if (!StringUtils.hasText(trimmed)) {
			return new GeneratedNumberDto(trimmed, false);
		}
		boolean taken = excludeId == null
				? voucherRepository.existsByVoucherNumberIgnoreCase(trimmed)
				: voucherRepository.existsByVoucherNumberIgnoreCaseAndIdNot(trimmed, excludeId);
		return new GeneratedNumberDto(trimmed, !taken);
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public PaymentVoucherDto create(PaymentVoucherCreateRequest request) {
		String voucherNumber = StringUtils.hasText(request.getVoucherNumber())
				? request.getVoucherNumber().trim()
				: generateNextNumber();
		if (voucherRepository.existsByVoucherNumberIgnoreCase(voucherNumber)) {
			throw new IllegalArgumentException(
					"Voucher number \"" + voucherNumber + "\" already exists. Please choose a unique number.");
		}

		Store store = storeRepository.findById(request.getStoreId())
				.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + request.getStoreId()));

		BigDecimal allocatedTotal = request.getAllocations().stream()
				.map(allocation -> nonNull(allocation.getAllocatedAmount()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		if (allocatedTotal.compareTo(request.getTotalAmount()) > 0) {
			throw new IllegalArgumentException(
					"Allocated amount (" + allocatedTotal + ") exceeds the received voucher amount ("
							+ request.getTotalAmount() + ").");
		}

		PaymentVoucher voucher = new PaymentVoucher();
		voucher.setStore(store);
		voucher.setVoucherNumber(voucherNumber);
		voucher.setVoucherDate(request.getDate());
		voucher.setCustomerName(request.getCustomerName());
		voucher.setCustomerTaxId(request.getCustomerTaxId());
		voucher.setTotalAmount(request.getTotalAmount());
		voucher.setAllocatedAmount(allocatedTotal);
		voucher.setUnallocatedAmount(request.getTotalAmount().subtract(allocatedTotal).max(BigDecimal.ZERO));
		voucher.setPaymentMethod(request.getPaymentMethod());
		voucher.setBankReference(request.getBankReference());
		voucher.setNotes(request.getNotes());
		voucher.setStatus(VoucherStatus.CONFIRMED);
		PaymentVoucher saved = voucherRepository.save(voucher);

		persistAllocations(saved, request.getAllocations());
		return mapper.toDto(saved);
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void delete(Long id) {
		PaymentVoucher voucher = requireVoucher(id);
		allocationRepository.findByVoucher_IdOrderByIdAsc(id).forEach(allocation -> {
			allocation.delete();
			allocationRepository.save(allocation);
		});
		voucher.delete();
		voucherRepository.save(voucher);
	}

	private void persistAllocations(PaymentVoucher voucher, List<AllocationRequest> requests) {
		List<Long> orderIds = requests.stream().map(AllocationRequest::getOrderId).distinct().toList();
		Map<Long, Order> ordersById = new HashMap<>();
		for (Order order : orderRepository.findAllById(orderIds)) {
			ordersById.put(order.getId(), order);
		}
		Map<Long, BigDecimal> previouslyPaid = new HashMap<>();
		for (Object[] row : allocationRepository.sumAllocatedByOrderIds(orderIds)) {
			previouslyPaid.put((Long) row[0], row[1] == null ? BigDecimal.ZERO : (BigDecimal) row[1]);
		}

		Instant now = Instant.now();
		for (AllocationRequest request : requests) {
			Order order = ordersById.get(request.getOrderId());
			if (order == null) {
				throw new ResourceNotFoundException("Order not found: id=" + request.getOrderId());
			}
			Invoice invoice = request.getInvoiceId() == null
					? null
					: invoiceRepository.findById(request.getInvoiceId())
							.orElseThrow(() -> new ResourceNotFoundException(
									"Invoice not found: id=" + request.getInvoiceId()));

			BigDecimal orderTotal = nonNull(order.getTotalAmount());
			BigDecimal previous = previouslyPaid.getOrDefault(order.getId(), BigDecimal.ZERO);
			BigDecimal allocated = nonNull(request.getAllocatedAmount());

			VoucherOrderAllocation allocation = new VoucherOrderAllocation();
			allocation.setVoucher(voucher);
			allocation.setOrder(order);
			allocation.setInvoice(invoice);
			allocation.setExternalOrderId(order.getExternalOrderId());
			allocation.setInvoiceNumber(invoice != null ? invoice.getInvoiceNumber() : null);
			allocation.setOrderTotalAmount(orderTotal);
			allocation.setAllocatedAmount(allocated);
			allocation.setPreviousPaidAmount(previous);
			allocation.setRemainingBalance(orderTotal.subtract(previous.add(allocated)).max(BigDecimal.ZERO));
			allocation.setBuyerName(order.getCustomer() != null ? order.getCustomer().getName() : null);
			allocation.setAllocatedAt(now);
			allocation.setNotes(request.getNotes());
			allocationRepository.save(allocation);

			previouslyPaid.put(order.getId(), previous.add(allocated));
		}
	}

	private String generateNextNumber() {
		LocalDate today = LocalDate.now(BUSINESS_ZONE);
		String prefix = "VCH-%d%02d-".formatted(today.getYear(), today.getMonthValue());
		int next = voucherRepository.findByVoucherNumberStartingWithIgnoreCase(prefix).stream()
				.map(voucher -> voucher.getVoucherNumber().substring(prefix.length()))
				.mapToInt(PaymentVoucherService::parseSuffix)
				.max()
				.orElse(0) + 1;
		return prefix + "%03d".formatted(next);
	}

	private static int parseSuffix(String value) {
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException ex) {
			return 0;
		}
	}

	private PaymentVoucher requireVoucher(Long id) {
		return voucherRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Payment voucher not found: id=" + id));
	}

	private static BigDecimal nonNull(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}
}
