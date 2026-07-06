package com.laconic.lacoinvoice.features.order;

import java.util.List;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.order.pageable.OrderPageRequest;

public interface OrderService {

	ApiResponse<List<OrderDto>> page(OrderPageRequest request);

	OrderDetailDto getDetailById(Long id);

	void triggerSync();
}
