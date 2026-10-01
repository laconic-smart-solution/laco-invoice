package com.laconic.lacoinvoice.features.order;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.order.history.OrderHistoryEventDto;
import com.laconic.lacoinvoice.features.order.history.OrderHistoryService;
import com.laconic.lacoinvoice.features.order.pageable.OrderPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders")
public class OrderController {

	private static final MediaType XLSX = MediaType.parseMediaType(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

	private final OrderService service;
	private final OrderHistoryService orderHistoryService;

	public OrderController(OrderService service, OrderHistoryService orderHistoryService) {
		this.service = service;
		this.orderHistoryService = orderHistoryService;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated order search")
	public ApiResponse<List<OrderDto>> pageable(@RequestBody @Valid OrderPageRequest request) {
		return service.page(request);
	}

	@GetMapping("/stats")
	@Operation(summary = "Order invoicing stats (optionally scoped by store)")
	public ApiResponse<OrderStatsDto> stats(@RequestParam(required = false) Long storeId) {
		return ApiResponse.ok("OK", service.stats(storeId));
	}

	@PostMapping("/export")
	@Operation(summary = "Export orders to Excel (selected IDs or all matching filter)")
	public ResponseEntity<byte[]> export(@RequestBody OrderExportRequest request) {
		byte[] body = service.exportExcel(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename() + "\"")
				.contentType(XLSX)
				.body(body);
	}

	@PostMapping("/export/preview")
	@Operation(summary = "Paginated preview of orders that will be exported")
	public ApiResponse<List<OrderDto>> exportPreview(@RequestBody OrderExportRequest request) {
		return service.exportPreview(request);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get order detail with line items")
	public ApiResponse<OrderDetailDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getDetailById(id));
	}

	@GetMapping("/{id}/history")
	@Operation(summary = "Paginated order history / audit trail (newest first)")
	public ApiResponse<List<OrderHistoryEventDto>> history(
			@PathVariable Long id,
			@RequestParam(defaultValue = "1") int pageNumber,
			@RequestParam(defaultValue = "10") int pageSize) {
		return orderHistoryService.page(id, pageNumber, pageSize);
	}

	@PostMapping("/sync")
	@Operation(summary = "Trigger order sync from marketplaces")
	public ResponseEntity<ApiResponse<Void>> sync() {
		service.triggerSync();
		return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok("Order sync accepted"));
	}
}
