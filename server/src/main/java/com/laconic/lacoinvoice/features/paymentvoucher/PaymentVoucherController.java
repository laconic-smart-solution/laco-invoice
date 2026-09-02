package com.laconic.lacoinvoice.features.paymentvoucher;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.invoice.dto.GeneratedNumberDto;
import com.laconic.lacoinvoice.features.paymentvoucher.dto.PaymentVoucherCreateRequest;
import com.laconic.lacoinvoice.features.paymentvoucher.dto.PaymentVoucherDto;
import com.laconic.lacoinvoice.features.paymentvoucher.pageable.PaymentVoucherPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/payment-vouchers")
@Tag(name = "Payment vouchers")
public class PaymentVoucherController {

	private final PaymentVoucherService service;

	public PaymentVoucherController(PaymentVoucherService service) {
		this.service = service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated payment voucher search")
	public ApiResponse<List<PaymentVoucherDto>> pageable(@RequestBody @Valid PaymentVoucherPageRequest request) {
		return service.page(request);
	}

	@GetMapping("/next-number")
	@Operation(summary = "Suggest the next available voucher number")
	public ApiResponse<GeneratedNumberDto> nextNumber() {
		return ApiResponse.ok("OK", service.nextNumber());
	}

	@GetMapping("/number-availability")
	@Operation(summary = "Check whether a voucher number is still free")
	public ApiResponse<GeneratedNumberDto> numberAvailability(
			@RequestParam String voucherNumber,
			@RequestParam(required = false) Long excludeId) {
		return ApiResponse.ok("OK", service.checkNumber(voucherNumber, excludeId));
	}

	@GetMapping("/by-invoice/{invoiceId}")
	@Operation(summary = "List payment vouchers allocated to an invoice")
	public ApiResponse<List<PaymentVoucherDto>> listByInvoice(@PathVariable Long invoiceId) {
		return ApiResponse.ok("OK", service.listByInvoice(invoiceId));
	}

	@PostMapping
	@Operation(summary = "Record a payment voucher and allocate it across orders")
	public ApiResponse<PaymentVoucherDto> create(@RequestBody @Valid PaymentVoucherCreateRequest request) {
		return ApiResponse.ok("Created", service.create(request));
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get payment voucher detail with allocations")
	public ApiResponse<PaymentVoucherDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getById(id));
	}

	@DeleteMapping("/{id}")
	@Operation(summary = "Delete a payment voucher and release its allocations")
	public ApiResponse<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ApiResponse.ok("Deleted");
	}
}
