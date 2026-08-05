package com.laconic.lacoinvoice.features.order.import_;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
	private final OrderImportPreviewService previewService;

	public OrderImportController(OrderImportService importService, OrderImportPreviewService previewService) {
		this.importService = importService;
		this.previewService = previewService;
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Import orders from TikTok OrderSKUList Excel (creates new only; skips duplicates)")
	public ApiResponse<OrderImportResultDto> importExcel(
			@RequestParam Long storeId,
			@RequestParam String marketplaceCode,
			@RequestParam("file") MultipartFile file) {
		OrderImportResultDto result = importService.importExcel(storeId, marketplaceCode, file);
		return ApiResponse.ok("Order import completed", result);
	}

	@PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Parse Excel and create an import preview batch with duplicate detection")
	public ApiResponse<OrderImportPreviewBatchDto> preview(
			@RequestParam Long storeId,
			@RequestParam String marketplaceCode,
			@RequestParam("file") MultipartFile file) {
		OrderImportPreviewBatchDto result = previewService.preview(storeId, marketplaceCode, file);
		return ApiResponse.ok("Import preview ready", result);
	}

	@GetMapping("/preview/{batchId}")
	@Operation(summary = "Get an open import preview batch")
	public ApiResponse<OrderImportPreviewBatchDto> getPreview(
			@RequestParam Long storeId,
			@PathVariable Long batchId) {
		return ApiResponse.ok("Import preview", previewService.getPreview(storeId, batchId));
	}

	@GetMapping("/preview/{batchId}/orders/{previewOrderId}/excel-rows")
	@Operation(summary = "List Excel source rows for a preview order (multi-line Order ID detail)")
	public ApiResponse<OrderImportPreviewExcelRowsDto> getExcelRows(
			@RequestParam Long storeId,
			@PathVariable Long batchId,
			@PathVariable Long previewOrderId) {
		return ApiResponse.ok(
				"Import preview Excel rows",
				previewService.getExcelRows(storeId, batchId, previewOrderId));
	}

	@PatchMapping("/preview/{batchId}/orders")
	@Operation(summary = "Set MERGE / SKIP / REPLACE actions on preview orders")
	public ApiResponse<OrderImportPreviewBatchDto> decide(
			@RequestParam Long storeId,
			@PathVariable Long batchId,
			@RequestBody OrderImportDecideRequest request) {
		return ApiResponse.ok("Import decisions saved", previewService.decide(storeId, batchId, request));
	}

	@PostMapping("/preview/{batchId}/commit")
	@Operation(summary = "Commit an import preview batch")
	public ApiResponse<OrderImportResultDto> commit(
			@RequestParam Long storeId,
			@PathVariable Long batchId) {
		OrderImportResultDto result = previewService.commit(storeId, batchId);
		return ApiResponse.ok("Order import committed", result);
	}
}
