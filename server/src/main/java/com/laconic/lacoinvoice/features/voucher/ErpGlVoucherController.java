package com.laconic.lacoinvoice.features.voucher;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDetailDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherGenerateRequest;
import com.laconic.lacoinvoice.features.voucher.pageable.ErpGlVoucherPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/vouchers")
@Tag(name = "Vouchers")
public class ErpGlVoucherController {

	private final ErpGlVoucherService service;

	public ErpGlVoucherController(ErpGlVoucherService service) {
		this.service = service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated voucher search")
	public ApiResponse<List<ErpGlVoucherDto>> pageable(@RequestBody @Valid ErpGlVoucherPageRequest request) {
		return service.page(request);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get voucher header and entry lines (ERP IDs only)")
	public ApiResponse<ErpGlVoucherDetailDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getById(id));
	}

	@PostMapping
	@Operation(summary = "Generate a GL voucher. Persists ERP IDs only; labels stay in ERP.")
	public ApiResponse<ErpGlVoucherDto> generate(@RequestBody @Valid ErpGlVoucherGenerateRequest request) {
		return ApiResponse.ok("Created", service.generate(request));
	}

	@PutMapping("/{id}")
	@Operation(summary = "Update a voucher that has not been posted to ERP")
	public ApiResponse<ErpGlVoucherDto> update(
			@PathVariable Long id,
			@RequestBody @Valid ErpGlVoucherGenerateRequest request) {
		return ApiResponse.ok("Updated", service.update(id, request));
	}

	@PostMapping("/{id}/post")
	@Operation(summary = "Post a generated voucher to ERP (stubbed until live ERP is wired)")
	public ApiResponse<ErpGlVoucherDto> postToErp(@PathVariable Long id) {
		return ApiResponse.ok("Posted", service.postToErp(id));
	}
}
