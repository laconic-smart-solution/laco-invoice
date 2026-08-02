package com.laconic.lacoinvoice.features.order.import_;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.laconic.lacoinvoice.common.web.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/orders/import")
@Tag(name = "Order import")
public class OrderImportController {

	private final OrderImportService importService;

	public OrderImportController(OrderImportService importService) {
		this.importService = importService;
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Import orders from TikTok OrderSKUList Excel export")
	public ApiResponse<OrderImportResultDto> importExcel(
			@RequestParam Long storeId,
			@RequestParam String marketplaceCode,
			@RequestParam("file") MultipartFile file) {
		OrderImportResultDto result = importService.importExcel(storeId, marketplaceCode, file);
		return ApiResponse.ok("Order import completed", result);
	}
}
