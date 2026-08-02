package com.laconic.lacoinvoice.features.order;

import java.util.List;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.order.pageable.OrderPageRequest;

public interface OrderService {

	ApiResponse<List<OrderDto>> page(OrderPageRequest request);

	OrderDetailDto getDetailById(Long id);

	OrderStatsDto stats(Long storeId);

	void triggerSync();

	byte[] exportExcel(OrderExportRequest request);

	String exportFilename();

	ApiResponse<List<OrderDto>> exportPreview(OrderExportRequest request);
}
