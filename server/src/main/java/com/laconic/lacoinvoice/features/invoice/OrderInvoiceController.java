package com.laconic.lacoinvoice.features.invoice;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.order.OrderExportRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order Invoices")
public class OrderInvoiceController {

	private static final MediaType ZIP = MediaType.parseMediaType("application/zip");

	private final InvoiceService invoiceService;

	public OrderInvoiceController(InvoiceService invoiceService) {
		this.invoiceService = invoiceService;
	}

	@PostMapping("/{orderId}/invoices")
	@Operation(summary = "Generate invoice for order")
	public ResponseEntity<ApiResponse<InvoiceDto>> generateInvoice(@PathVariable Long orderId) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Invoice generated", invoiceService.generateForOrder(orderId)));
	}

	@PostMapping("/bulk-generate")
	@Operation(summary = "Generate invoices for selected/matching orders and download PDFs as a ZIP")
	public ResponseEntity<byte[]> bulkGenerate(@RequestBody OrderExportRequest request) {
		byte[] body = invoiceService.bulkGenerateZip(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(
						HttpHeaders.CONTENT_DISPOSITION,
						"attachment; filename=\"" + invoiceService.bulkGenerateZipFilename() + "\"")
				.contentType(ZIP)
				.body(body);
	}
}
