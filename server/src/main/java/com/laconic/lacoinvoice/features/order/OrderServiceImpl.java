package com.laconic.lacoinvoice.features.order;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.order.pageable.OrderPageRequest;

@Service
public class OrderServiceImpl implements OrderService {

	private static final Map<String, String> ORDER_FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"marketplaceId", "marketplace.id",
			"marketplaceCode", "marketplace.code");

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
						dto.subtotal(),
						dto.shippingFee(),
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
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void triggerSync() {
		storeRepository.findByActiveTrue()
				.forEach(store -> orderSyncService.ingestOrders(store.getId()));
	}
}
