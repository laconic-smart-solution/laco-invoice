package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.InvoiceItem;
import com.laconic.lacoinvoice.domain.models.InvoiceOrder;
import com.laconic.lacoinvoice.domain.models.InvoiceStatus;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderInputRun;
import com.laconic.lacoinvoice.domain.models.OrderItem;
import com.laconic.lacoinvoice.domain.models.OrderTaxInvoice;
import com.laconic.lacoinvoice.domain.models.PaymentAllocationStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.InvoiceItemRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceOrderRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderInputRunRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderTaxInvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.invoice.dto.GeneratedNumberDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceCreateRequest;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceDetailDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceItemLineDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceOrderSummaryDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoicePaymentSummaryDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoicePreviewDto;
import com.laconic.lacoinvoice.features.invoice.pageable.InvoicePageRequest;

@Service
public class InvoiceService {

	private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Bangkok");
	private static final BigDecimal DEFAULT_VAT_RATE = new BigDecimal("0.0700");
	private static final String DEFAULT_CURRENCY = "THB";

	private static final Map<String, String> FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"marketplaceId", "marketplace.id",
			"marketplaceCode", "marketplace.code",
			"invoiceNumber", "invoiceNumber",
			"title", "title",
			"status", "status");

	private final InvoiceRepository invoiceRepository;
	private final InvoiceOrderRepository invoiceOrderRepository;
	private final InvoiceItemRepository invoiceItemRepository;
	private final OrderRepository orderRepository;
	private final OrderTaxInvoiceRepository orderTaxInvoiceRepository;
	private final OrderInputRunRepository orderInputRunRepository;
	private final StoreRepository storeRepository;
	private final MarketplaceRepository marketplaceRepository;
	private final InvoiceMapper mapper;

	public InvoiceService(
			InvoiceRepository invoiceRepository,
			InvoiceOrderRepository invoiceOrderRepository,
			InvoiceItemRepository invoiceItemRepository,
			OrderRepository orderRepository,
			OrderTaxInvoiceRepository orderTaxInvoiceRepository,
			OrderInputRunRepository orderInputRunRepository,
			StoreRepository storeRepository,
			MarketplaceRepository marketplaceRepository,
			InvoiceMapper mapper) {
		this.invoiceRepository = invoiceRepository;
		this.invoiceOrderRepository = invoiceOrderRepository;
		this.invoiceItemRepository = invoiceItemRepository;
		this.orderRepository = orderRepository;
		this.orderTaxInvoiceRepository = orderTaxInvoiceRepository;
		this.orderInputRunRepository = orderInputRunRepository;
		this.storeRepository = storeRepository;
		this.marketplaceRepository = marketplaceRepository;
		this.mapper = mapper;
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<InvoiceDto>> page(InvoicePageRequest request) {
		return PageQuerySupport.query(
				invoiceRepository,
				mapper,
				request.toPageAndFilter(),
				Invoice.class,
				request.getFilter(),
				FILTER_FIELD_PATHS);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceDetailDto getById(Long id) {
		Invoice invoice = requireInvoice(id);
		List<InvoiceOrder> invoiceOrders = invoiceOrderRepository.findByInvoice_IdOrderByOrderDateAscIdAsc(id);
		List<InvoiceItem> invoiceItems = invoiceItemRepository.findByInvoice_IdOrderByOrderDateAscIdAsc(id);
		boolean fullyPaid = invoice.getStatus() == InvoiceStatus.PAID;

		List<InvoiceOrderSummaryDto> orders = invoiceOrders.stream()
				.map(io -> {
					BigDecimal total = nonNull(io.getTotalAmount());
					BigDecimal paid = fullyPaid ? total : BigDecimal.ZERO;
					BigDecimal remaining = total.subtract(paid).max(BigDecimal.ZERO);
					return mapper.toOrderSummaryDto(io, paid, remaining, allocationStatus(total, paid));
				})
				.toList();

		List<InvoiceItemLineDto> items = invoiceItems.stream().map(mapper::toItemLineDto).toList();

		return new InvoiceDetailDto(mapper.toDto(invoice), orders, items, buildPaymentSummary(invoice));
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoicePaymentSummaryDto paymentSummary(Long id) {
		return buildPaymentSummary(requireInvoice(id));
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
	public GeneratedNumberDto checkNumber(String invoiceNumber, Long excludeId) {
		String trimmed = invoiceNumber == null ? "" : invoiceNumber.trim();
		if (!StringUtils.hasText(trimmed)) {
			return new GeneratedNumberDto(trimmed, false);
		}
		boolean taken = excludeId == null
				? invoiceRepository.existsByInvoiceNumberIgnoreCase(trimmed)
				: invoiceRepository.existsByInvoiceNumberIgnoreCaseAndIdNot(trimmed, excludeId);
		return new GeneratedNumberDto(trimmed, !taken);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoicePreviewDto preview(InvoiceCreateRequest request) {
		BillableOrders billable = collectBillableOrders(request);
		BigDecimal vatRate = resolveVatRate(request.getVatRate());
		Totals totals = totals(billable.orders(), billable.itemsByOrderId(), vatRate);
		return new InvoicePreviewDto(
				billable.orders().size(),
				totals.itemCount(),
				totals.subtotal(),
				vatRate,
				totals.vatAmount(),
				totals.grandTotal(),
				resolveCurrency(billable.orders()),
				billable.skippedAlreadyBilled());
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceDto create(InvoiceCreateRequest request) {
		String invoiceNumber = StringUtils.hasText(request.getInvoiceNumber())
				? request.getInvoiceNumber().trim()
				: generateNextNumber();
		if (invoiceRepository.existsByInvoiceNumberIgnoreCase(invoiceNumber)) {
			throw new IllegalArgumentException(
					"Invoice number \"" + invoiceNumber + "\" already exists. Please choose a unique number.");
		}

		BillableOrders billable = collectBillableOrders(request);
		if (billable.orders().isEmpty()) {
			throw new IllegalArgumentException(
					"No billable orders found for the selected store and period. "
							+ billable.skippedAlreadyBilled() + " order(s) are already on another invoice.");
		}

		BigDecimal vatRate = resolveVatRate(request.getVatRate());
		Totals totals = totals(billable.orders(), billable.itemsByOrderId(), vatRate);

		Invoice invoice = new Invoice();
		invoice.setStore(billable.store());
		invoice.setMarketplace(billable.marketplace());
		invoice.setOrderInputRun(billable.orderInputRun());
		invoice.setInvoiceNumber(invoiceNumber);
		invoice.setTitle(request.getTitle().trim());
		invoice.setStatus(InvoiceStatus.ISSUED);
		invoice.setStartDate(request.getStartDate());
		invoice.setEndDate(request.getEndDate());
		invoice.setOrderCount(billable.orders().size());
		invoice.setItemCount(totals.itemCount());
		invoice.setSubtotal(totals.subtotal());
		invoice.setVatRate(vatRate);
		invoice.setVatAmount(totals.vatAmount());
		invoice.setGrandTotal(totals.grandTotal());
		invoice.setCurrency(resolveCurrency(billable.orders()));
		invoice.setNotes(request.getNotes());
		invoice.setBuyerName(request.getBuyerName());
		invoice.setBuyerTaxId(request.getBuyerTaxId());
		invoice.setBuyerAddress(request.getBuyerAddress());
		invoice.setIssuedAt(Instant.now());
		Invoice saved = invoiceRepository.save(invoice);

		persistSnapshots(saved, billable, vatRate);
		return mapper.toDto(saved);
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceDto updateNumber(Long id, String invoiceNumber) {
		Invoice invoice = requireInvoice(id);
		String trimmed = invoiceNumber == null ? "" : invoiceNumber.trim();
		if (!StringUtils.hasText(trimmed)) {
			throw new IllegalArgumentException("Invoice number cannot be empty");
		}
		if (invoiceRepository.existsByInvoiceNumberIgnoreCaseAndIdNot(trimmed, id)) {
			throw new IllegalArgumentException(
					"Invoice number \"" + trimmed + "\" is already in use by another invoice.");
		}
		invoice.setInvoiceNumber(trimmed);
		return mapper.toDto(invoiceRepository.save(invoice));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public InvoiceDto updateStatus(Long id, InvoiceStatus status) {
		Invoice invoice = requireInvoice(id);
		invoice.setStatus(status);
		invoice.setPaidAt(status == InvoiceStatus.PAID ? Instant.now() : null);
		return mapper.toDto(invoiceRepository.save(invoice));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void delete(Long id) {
		Invoice invoice = requireInvoice(id);
		invoiceItemRepository.findByInvoice_IdOrderByOrderDateAscIdAsc(id).forEach(item -> {
			item.delete();
			invoiceItemRepository.save(item);
		});
		invoiceOrderRepository.findByInvoice_IdOrderByOrderDateAscIdAsc(id).forEach(order -> {
			order.delete();
			invoiceOrderRepository.save(order);
		});
		invoice.delete();
		invoiceRepository.save(invoice);
	}

	private void persistSnapshots(Invoice invoice, BillableOrders billable, BigDecimal vatRate) {
		for (Order order : billable.orders()) {
			List<OrderItem> orderItems = billable.itemsByOrderId().getOrDefault(order.getId(), List.of());

			InvoiceOrder snapshot = new InvoiceOrder();
			snapshot.setInvoice(invoice);
			snapshot.setOrder(order);
			snapshot.setExternalOrderId(order.getExternalOrderId());
			snapshot.setOrderDate(toLocalDate(order.getOrderDate()));
			snapshot.setItemCount(totalQuantity(orderItems));
			BigDecimal total = nonNull(order.getTotalAmount());
			BigDecimal vat = vatOf(order, total, vatRate);
			snapshot.setTotalAmount(total);
			snapshot.setVatAmount(vat);
			snapshot.setAmountExVat(total.subtract(vat));
			snapshot.setBuyerName(order.getCustomer() != null ? order.getCustomer().getName() : null);
			snapshot.setBuyerTaxId(billable.buyerTaxIdByOrderId().get(order.getId()));
			invoiceOrderRepository.save(snapshot);

			for (OrderItem orderItem : orderItems) {
				InvoiceItem line = new InvoiceItem();
				line.setInvoice(invoice);
				line.setOrder(order);
				line.setExternalOrderId(order.getExternalOrderId());
				line.setOrderDate(toLocalDate(order.getOrderDate()));
				line.setPlatformSkuId(orderItem.getPlatformSkuId());
				line.setSellerSku(orderItem.getSku());
				line.setProductName(orderItem.getProductName());
				line.setVariation(orderItem.getVariation());
				line.setQuantity(orderItem.getQuantity());
				line.setUnitPrice(nonNull(orderItem.getPrice()));
				line.setSubtotal(nonNull(orderItem.getSubtotalBeforeDiscount()));
				line.setDiscount(nonNull(orderItem.getItemPlatformDiscount())
						.add(nonNull(orderItem.getItemSellerDiscount())));
				line.setTotalAmount(nonNull(orderItem.getLineTotal()));
				invoiceItemRepository.save(line);
			}
		}
	}

	private BillableOrders collectBillableOrders(InvoiceCreateRequest request) {
		Store store = storeRepository.findById(request.getStoreId())
				.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + request.getStoreId()));
		Marketplace marketplace = marketplaceRepository.findByCodeIgnoreCase(request.getMarketplaceCode())
				.orElseThrow(() -> new IllegalArgumentException(
						"Marketplace not found: code=" + request.getMarketplaceCode()));

		OrderInputRun run = null;
		List<Order> candidates;
		if (request.getOrderRunId() != null) {
			run = orderInputRunRepository.findById(request.getOrderRunId())
					.orElseThrow(() -> new ResourceNotFoundException(
							"Order input run not found: id=" + request.getOrderRunId()));
			Long importFileId = run.getOrderDetailImportFile() != null
					? run.getOrderDetailImportFile().getId()
					: null;
			if (importFileId == null) {
				throw new IllegalArgumentException(
						"Order data input \"" + run.getTitle() + "\" has no committed orders to bill.");
			}
			candidates = orderRepository.findBillableByImportFile(
					store.getId(), marketplace.getId(), importFileId);
		} else {
			candidates = orderRepository.findBillableByPeriod(
					store.getId(),
					marketplace.getId(),
					startOfDay(request.getStartDate()),
					startOfDay(request.getEndDate().plusDays(1)));
		}

		List<Long> candidateIds = candidates.stream().map(Order::getId).toList();
		Set<Long> alreadyBilled = candidateIds.isEmpty()
				? Set.of()
				: new HashSet<>(invoiceOrderRepository.findAlreadyBilledOrderIds(candidateIds));

		List<Order> billable = candidates.stream()
				.filter(order -> !alreadyBilled.contains(order.getId()))
				.sorted(Comparator.comparing(
						(Order order) -> order.getOrderDate() == null ? Instant.EPOCH : order.getOrderDate())
						.thenComparing(Order::getId))
				.toList();

		List<Long> billableIds = billable.stream().map(Order::getId).toList();
		Map<Long, List<OrderItem>> itemsByOrderId = new HashMap<>();
		Map<Long, String> buyerTaxIdByOrderId = new HashMap<>();
		if (!billableIds.isEmpty()) {
			for (OrderItem item : orderRepository.findItemsByOrderIds(billableIds)) {
				itemsByOrderId.computeIfAbsent(item.getOrder().getId(), key -> new ArrayList<>()).add(item);
			}
			for (OrderTaxInvoice tax : orderTaxInvoiceRepository.findByOrder_IdIn(billableIds)) {
				if (StringUtils.hasText(tax.getBuyerTaxId())) {
					buyerTaxIdByOrderId.put(tax.getOrder().getId(), tax.getBuyerTaxId());
				}
			}
		}

		return new BillableOrders(
				store,
				marketplace,
				run,
				billable,
				itemsByOrderId,
				buyerTaxIdByOrderId,
				alreadyBilled.size());
	}

	private Totals totals(List<Order> orders, Map<Long, List<OrderItem>> itemsByOrderId, BigDecimal vatRate) {
		BigDecimal grandTotal = BigDecimal.ZERO;
		BigDecimal vatAmount = BigDecimal.ZERO;
		int itemCount = 0;
		for (Order order : orders) {
			BigDecimal total = nonNull(order.getTotalAmount());
			grandTotal = grandTotal.add(total);
			vatAmount = vatAmount.add(vatOf(order, total, vatRate));
			itemCount += totalQuantity(itemsByOrderId.getOrDefault(order.getId(), List.of()));
		}
		return new Totals(itemCount, grandTotal.subtract(vatAmount), vatAmount, grandTotal);
	}

	private InvoicePaymentSummaryDto buildPaymentSummary(Invoice invoice) {
		BigDecimal total = nonNull(invoice.getGrandTotal());
		boolean fullyPaid = invoice.getStatus() == InvoiceStatus.PAID;
		BigDecimal paid = fullyPaid ? total : BigDecimal.ZERO;
		BigDecimal remaining = fullyPaid ? BigDecimal.ZERO : total;
		return new InvoicePaymentSummaryDto(
				invoice.getId(),
				invoice.getInvoiceNumber(),
				total,
				paid,
				remaining,
				allocationStatus(total, paid),
				fullyPaid ? 100 : 0);
	}

	private String generateNextNumber() {
		LocalDate today = LocalDate.now(BUSINESS_ZONE);
		String prefix = "INV-%d%02d-".formatted(today.getYear(), today.getMonthValue());
		int next = invoiceRepository.findByInvoiceNumberStartingWithIgnoreCase(prefix).stream()
				.map(invoice -> invoice.getInvoiceNumber().substring(prefix.length()))
				.mapToInt(InvoiceService::parseSuffix)
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

	private Invoice requireInvoice(Long id) {
		return invoiceRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + id));
	}

	private static PaymentAllocationStatus allocationStatus(BigDecimal total, BigDecimal paid) {
		if (total.signum() <= 0) {
			return PaymentAllocationStatus.UNPAID;
		}
		int comparison = paid.compareTo(total);
		if (comparison > 0) {
			return PaymentAllocationStatus.OVERPAID;
		}
		if (comparison == 0) {
			return PaymentAllocationStatus.PAID;
		}
		return paid.signum() > 0 ? PaymentAllocationStatus.PARTIAL : PaymentAllocationStatus.UNPAID;
	}

	/** Uses the VAT stored on the order when the importer computed it, otherwise derives it. */
	private static BigDecimal vatOf(Order order, BigDecimal total, BigDecimal vatRate) {
		if (order.getVatAmount() != null) {
			return order.getVatAmount();
		}
		if (vatRate.signum() <= 0) {
			return BigDecimal.ZERO;
		}
		BigDecimal exVat = total.divide(BigDecimal.ONE.add(vatRate), 2, RoundingMode.HALF_UP);
		return total.subtract(exVat);
	}

	private static int totalQuantity(List<OrderItem> items) {
		return items.stream().mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity()).sum();
	}

	private static String resolveCurrency(List<Order> orders) {
		return orders.stream()
				.map(Order::getCurrency)
				.filter(StringUtils::hasText)
				.findFirst()
				.orElse(DEFAULT_CURRENCY);
	}

	private static BigDecimal resolveVatRate(BigDecimal requested) {
		return requested == null || requested.signum() < 0 ? DEFAULT_VAT_RATE : requested;
	}

	private static BigDecimal nonNull(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static Instant startOfDay(LocalDate date) {
		return date.atStartOfDay(BUSINESS_ZONE).toInstant();
	}

	private static LocalDate toLocalDate(Instant instant) {
		return instant == null ? null : instant.atZone(BUSINESS_ZONE).toLocalDate();
	}

	private record BillableOrders(
			Store store,
			Marketplace marketplace,
			OrderInputRun orderInputRun,
			List<Order> orders,
			Map<Long, List<OrderItem>> itemsByOrderId,
			Map<Long, String> buyerTaxIdByOrderId,
			int skippedAlreadyBilled) {
	}

	private record Totals(int itemCount, BigDecimal subtotal, BigDecimal vatAmount, BigDecimal grandTotal) {
	}
}
