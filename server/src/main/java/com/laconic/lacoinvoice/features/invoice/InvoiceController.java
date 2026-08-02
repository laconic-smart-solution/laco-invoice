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
import org.springframework.web.bind.annotation.RequestParam;
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

	private static final MediaType XLSX = MediaType.parseMediaType(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	private static final MediaType ZIP = MediaType.parseMediaType("application/zip");

	private final InvoiceService service;

	public InvoiceController(InvoiceService service) {
		this.service = service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated invoice search")
	public ApiResponse<List<InvoiceListItemDto>> pageable(@RequestBody @Valid InvoicePageRequest request) {
		return service.page(request);
	}

	@GetMapping("/stats")
	@Operation(summary = "Invoice stats (optionally scoped by store)")
	public ApiResponse<InvoiceStatsDto> stats(@RequestParam(required = false) Long storeId) {
		return ApiResponse.ok("OK", service.stats(storeId));
	}

	@PostMapping("/export")
	@Operation(summary = "Export invoices to Excel (selected IDs or all matching filter)")
	public ResponseEntity<byte[]> export(@RequestBody InvoiceExportRequest request) {
		byte[] body = service.exportExcel(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename() + "\"")
				.contentType(XLSX)
				.body(body);
	}

	@PostMapping("/export/preview")
	@Operation(summary = "Paginated preview of invoices that will be exported")
	public ApiResponse<List<InvoiceListItemDto>> exportPreview(@RequestBody InvoiceExportRequest request) {
		return service.exportPreview(request);
	}

	@PostMapping("/bulk-pdf")
	@Operation(summary = "Download selected (or all matching) invoice PDFs as a ZIP")
	public ResponseEntity<byte[]> bulkPdf(@RequestBody InvoiceExportRequest request) {
		byte[] body = service.bulkPdfZip(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.bulkPdfZipFilename() + "\"")
				.contentType(ZIP)
				.body(body);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get invoice detail")
	public ApiResponse<InvoiceDetailDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getDetailById(id));
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
