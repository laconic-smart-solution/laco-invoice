package com.laconic.lacoinvoice.features.invoice;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.invoice.bulk.OrderBulkGenerateRunDto;
import com.laconic.lacoinvoice.features.invoice.bulk.OrderBulkGenerateService;
import com.laconic.lacoinvoice.features.order.OrderExportRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order Invoices")
public class OrderInvoiceController {

	private static final MediaType ZIP = MediaType.parseMediaType("application/zip");

	private final InvoiceService invoiceService;
	private final OrderBulkGenerateService bulkGenerateService;

	public OrderInvoiceController(
			InvoiceService invoiceService,
			OrderBulkGenerateService bulkGenerateService) {
		this.invoiceService = invoiceService;
		this.bulkGenerateService = bulkGenerateService;
	}

	@PostMapping("/{orderId}/invoices")
	@Operation(summary = "Generate invoice for order")
	public ResponseEntity<ApiResponse<InvoiceDto>> generateInvoice(@PathVariable Long orderId) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Invoice generated", invoiceService.generateForOrder(orderId)));
	}

	@PostMapping("/bulk-generate")
	@Operation(summary = "Start async bulk invoice generate job (ZIP when complete)")
	public ApiResponse<OrderBulkGenerateRunDto> startBulkGenerate(@RequestBody OrderExportRequest request) {
		return ApiResponse.ok("Bulk generate started", bulkGenerateService.start(request));
	}

	@GetMapping("/bulk-generate/{runId}")
	@Operation(summary = "Get bulk invoice generate job status")
	public ApiResponse<OrderBulkGenerateRunDto> getBulkGenerateRun(@PathVariable Long runId) {
		return ApiResponse.ok("OK", bulkGenerateService.getRun(runId));
	}

	@GetMapping("/bulk-generate/{runId}/download")
	@Operation(summary = "Download ZIP of generated invoice PDFs for a completed run")
	public ResponseEntity<Resource> downloadBulkGenerateZip(@PathVariable Long runId) {
		Resource body = bulkGenerateService.downloadZip(runId);
		String filename = bulkGenerateService.downloadFilename(runId);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
				.contentType(ZIP)
				.body(body);
	}
}
