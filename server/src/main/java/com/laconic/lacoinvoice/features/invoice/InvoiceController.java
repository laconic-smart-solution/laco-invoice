package com.laconic.lacoinvoice.features.invoice;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.invoice.dto.GeneratedNumberDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceCreateRequest;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceDetailDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceNumberUpdateRequest;
import com.laconic.lacoinvoice.features.invoice.dto.InvoicePaymentSummaryDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoicePreviewDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceStatusUpdateRequest;
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

	@PostMapping("/pageable")
	@Operation(summary = "Paginated invoice search")
	public ApiResponse<List<InvoiceDto>> pageable(@RequestBody @Valid InvoicePageRequest request) {
		return service.page(request);
	}

	@GetMapping("/next-number")
	@Operation(summary = "Suggest the next available invoice number")
	public ApiResponse<GeneratedNumberDto> nextNumber() {
		return ApiResponse.ok("OK", service.nextNumber());
	}

	@GetMapping("/number-availability")
	@Operation(summary = "Check whether an invoice number is still free")
	public ApiResponse<GeneratedNumberDto> numberAvailability(
			@RequestParam String invoiceNumber,
			@RequestParam(required = false) Long excludeId) {
		return ApiResponse.ok("OK", service.checkNumber(invoiceNumber, excludeId));
	}

	@PostMapping("/preview")
	@Operation(summary = "Preview order aggregation and VAT totals before creating an invoice")
	public ApiResponse<InvoicePreviewDto> preview(@RequestBody @Valid InvoiceCreateRequest request) {
		return ApiResponse.ok("OK", service.preview(request));
	}

	@PostMapping
	@Operation(summary = "Create a consolidated invoice from real orders")
	public ApiResponse<InvoiceDto> create(@RequestBody @Valid InvoiceCreateRequest request) {
		return ApiResponse.ok("Created", service.create(request));
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get invoice detail with billed orders, line items and payment summary")
	public ApiResponse<InvoiceDetailDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getById(id));
	}

	@GetMapping("/{id}/payment-summary")
	@Operation(summary = "Get payment summary for an invoice")
	public ApiResponse<InvoicePaymentSummaryDto> paymentSummary(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.paymentSummary(id));
	}

	@PutMapping("/{id}/number")
	@Operation(summary = "Rename the invoice number")
	public ApiResponse<InvoiceDto> updateNumber(
			@PathVariable Long id,
			@RequestBody @Valid InvoiceNumberUpdateRequest request) {
		return ApiResponse.ok("Updated", service.updateNumber(id, request.getInvoiceNumber()));
	}

	@PatchMapping("/{id}/status")
	@Operation(summary = "Update invoice status (DRAFT / ISSUED / PAID / VOID)")
	public ApiResponse<InvoiceDto> updateStatus(
			@PathVariable Long id,
			@RequestBody @Valid InvoiceStatusUpdateRequest request) {
		return ApiResponse.ok("Updated", service.updateStatus(id, request.getStatus()));
	}

	@DeleteMapping("/{id}")
	@Operation(summary = "Delete an invoice and its billed order/item snapshots")
	public ApiResponse<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ApiResponse.ok("Deleted");
	}
}
