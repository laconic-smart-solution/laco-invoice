package com.laconic.lacoinvoice.features.order.importfile;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.order.importfile.pageable.OrderImportFilePageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/order-import-files")
@Tag(name = "Order import files")
public class OrderImportFileController {

	private final OrderImportFileService service;

	public OrderImportFileController(OrderImportFileService service) {
		this.service = service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated imported Excel file list")
	public ApiResponse<List<OrderImportFileDto>> pageable(@RequestBody @Valid OrderImportFilePageRequest request) {
		return service.page(request);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get imported Excel file detail")
	public ApiResponse<OrderImportFileDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getById(id));
	}
}
