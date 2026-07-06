package com.laconic.lacoinvoice.features.order;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.order.pageable.OrderPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders")
public class OrderController {

	private final OrderService service;

	public OrderController(OrderService service) {
		this.service = service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated order search")
	public ApiResponse<List<OrderDto>> pageable(@RequestBody @Valid OrderPageRequest request) {
		return service.page(request);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get order detail with line items")
	public ApiResponse<OrderDetailDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getDetailById(id));
	}

	@PostMapping("/sync")
	@Operation(summary = "Trigger order sync from marketplaces")
	public ResponseEntity<ApiResponse<Void>> sync() {
		service.triggerSync();
		return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok("Order sync accepted"));
	}
}
