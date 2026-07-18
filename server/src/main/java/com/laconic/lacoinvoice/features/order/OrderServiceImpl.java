package com.laconic.lacoinvoice.features.order;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.Order;
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
	private final OrderMapper mapper;
	private final OrderSyncService orderSyncService;

	public OrderServiceImpl(
			OrderRepository orderRepository,
			StoreRepository storeRepository,
			OrderMapper mapper,
			OrderSyncService orderSyncService) {
		this.orderRepository = orderRepository;
		this.storeRepository = storeRepository;
		this.mapper = mapper;
		this.orderSyncService = orderSyncService;
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<OrderDto>> page(OrderPageRequest request) {
		return PageQuerySupport.query(
				orderRepository,
				mapper,
				request.toPageAndFilter(),
				Order.class,
				request.getFilter(),
				ORDER_FILTER_FIELD_PATHS);
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderDetailDto getDetailById(Long id) {
		Order order = orderRepository.findDetailById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found: id=" + id));
		List<OrderItemDto> items = orderRepository.findItemsByOrderId(id).stream()
				.map(mapper::toItemDto)
				.toList();
		return new OrderDetailDto(
				mapper.toDto(order),
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
