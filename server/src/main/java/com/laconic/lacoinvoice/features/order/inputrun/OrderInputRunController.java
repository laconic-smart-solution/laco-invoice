package com.laconic.lacoinvoice.features.order.inputrun;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.order.import_.OrderImportPreviewBatchDto;
import com.laconic.lacoinvoice.features.order.import_.OrderImportResultDto;
import com.laconic.lacoinvoice.features.order.inputrun.pageable.OrderInputRunPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/order-input-runs")
@Tag(name = "Order input runs")
public class OrderInputRunController {

	private final OrderInputRunService service;

	public OrderInputRunController(OrderInputRunService service) {
		this.service = service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated order input runs")
	public ApiResponse<List<OrderInputRunDto>> pageable(@RequestBody @Valid OrderInputRunPageRequest request) {
		return service.page(request);
	}

	@PostMapping
	@Operation(summary = "Create an order input run (title + store + marketplace)")
	public ApiResponse<OrderInputRunDto> create(@RequestBody @Valid OrderInputRunCreateRequest request) {
		return ApiResponse.ok("Created", service.create(request));
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get order input run detail")
	public ApiResponse<OrderInputRunDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getById(id));
	}

	@PutMapping("/{id}/title")
	@Operation(summary = "Update order set title")
	public ApiResponse<OrderInputRunDto> updateTitle(
			@PathVariable Long id,
			@RequestBody Map<String, String> body) {
		String title = body != null ? body.get("title") : null;
		return ApiResponse.ok("Title updated", service.updateTitle(id, title));
	}

	@PostMapping(value = "/{id}/files/order-detail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Upload Order Detail Excel (OrderSKUList)")
	public ApiResponse<OrderInputRunDto> uploadOrderDetail(
			@PathVariable Long id,
			@RequestParam("file") MultipartFile file) {
		return ApiResponse.ok("Order detail file uploaded", service.uploadOrderDetail(id, file));
	}

	@PostMapping(value = "/{id}/files/withdraw", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Upload Total Withdraw / Payout Excel")
	public ApiResponse<OrderInputRunDto> uploadWithdraw(
			@PathVariable Long id,
			@RequestParam("file") MultipartFile file) {
		return ApiResponse.ok("Withdraw file uploaded", service.uploadWithdraw(id, file));
	}

	@PostMapping("/{id}/run/preview")
	@Operation(summary = "Run Order Detail: create import preview (MERGE/REPLACE/SKIP)")
	public ApiResponse<OrderImportPreviewBatchDto> startRunPreview(@PathVariable Long id) {
		return ApiResponse.ok("Import preview ready", service.startRunPreview(id));
	}

	@PostMapping("/{id}/run/cancel-preview")
	@Operation(summary = "Cancel an open Order Detail import preview for this run")
	public ApiResponse<OrderInputRunDto> cancelRunPreview(@PathVariable Long id) {
		return ApiResponse.ok("Preview cancelled", service.cancelRunPreview(id));
	}

	@PostMapping("/{id}/run/reset-stuck")
	@Operation(summary = "Reset abandoned RUNNING status after refresh or closed preview")
	public ApiResponse<OrderInputRunDto> resetStuck(@PathVariable Long id) {
		return ApiResponse.ok("Stuck run reset", service.resetStuckRunning(id));
	}

	@PostMapping("/{id}/run/finish")
	@Operation(summary = "After Order Detail preview commit: finalize Order Detail status")
	public ApiResponse<OrderInputRunDto> finishRun(
			@PathVariable Long id,
			@RequestBody OrderImportResultDto importResult) {
		return ApiResponse.ok("Order detail finished", service.finishRunAfterOrderDetail(id, importResult));
	}

	@PostMapping("/{id}/run/withdraw")
	@Operation(summary = "Run Total Withdraw Excel only")
	public ApiResponse<OrderInputRunDto> runWithdraw(@PathVariable Long id) {
		return ApiResponse.ok("Withdraw run completed", service.runWithdrawFile(id));
	}

	@DeleteMapping("/{id}")
	@Operation(summary = "Delete order input run set and cascade delete all associated data")
	public ApiResponse<Void> deleteSet(@PathVariable Long id) {
		service.deleteSet(id);
		return ApiResponse.ok("Order set deleted successfully", null);
	}

	@PostMapping("/{id}/rollback/order-detail")
	@Operation(summary = "Rollback Order Detail file and delete all imported orders")
	public ApiResponse<OrderInputRunDto> rollbackOrderDetail(@PathVariable Long id) {
		return ApiResponse.ok("Order detail file rolled back and data deleted", service.rollbackOrderDetail(id));
	}

	@PostMapping("/{id}/rollback/withdraw")
	@Operation(summary = "Rollback Withdraw file and delete all settlement rows")
	public ApiResponse<OrderInputRunDto> rollbackWithdraw(@PathVariable Long id) {
		return ApiResponse.ok("Withdraw file rolled back and data deleted", service.rollbackWithdraw(id));
	}

	@GetMapping("/{id}/withdraw-rows")
	@Operation(summary = "Pageable withdraw/settlement rows for a run")
	public ApiResponse<List<OrderWithdrawImportRowDto>> withdrawRows(
			@PathVariable Long id,
			@RequestParam(defaultValue = "1") int pageNumber,
			@RequestParam(defaultValue = "20") int pageSize,
			@RequestParam(required = false) String externalOrderId,
			@RequestParam(required = false) String matchStatus,
			@RequestParam(required = false) String applyStatus,
			@RequestParam(defaultValue = "excelRowIndex") String sortBy,
			@RequestParam(defaultValue = "ASC") String sortOrder) {
		return service.pageWithdrawRows(
				id, pageNumber, pageSize, externalOrderId, matchStatus, applyStatus, sortBy, sortOrder);
	}
}
