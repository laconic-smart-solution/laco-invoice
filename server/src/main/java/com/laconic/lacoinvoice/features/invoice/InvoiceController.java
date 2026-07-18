package com.laconic.lacoinvoice.features.invoice;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.invoice.pageable.InvoicePageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoices")
public class InvoiceController {

	private final InvoiceService service;

	public InvoiceController(InvoiceService service) {
		this.service = service;
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get invoice detail")
	public ApiResponse<InvoiceDetailDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getDetailById(id));
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated invoice search")
	public ApiResponse<List<InvoiceListItemDto>> pageable(@RequestBody @Valid InvoicePageRequest request) {
		return service.page(request);
	}

	@PatchMapping("/{id}/void")
	@Operation(summary = "Void invoice (manager/admin)")
	public ApiResponse<InvoiceDto> voidInvoice(@PathVariable Long id) {
		return ApiResponse.ok("Invoice voided", service.voidInvoice(id));
	}

	@GetMapping("/{id}/pdf")
	@Operation(summary = "Download invoice PDF")
	public ResponseEntity<byte[]> getPdf(@PathVariable Long id) {
		byte[] pdf = service.renderPdf(id);
		String filename = service.pdfFilename(id);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}
}
