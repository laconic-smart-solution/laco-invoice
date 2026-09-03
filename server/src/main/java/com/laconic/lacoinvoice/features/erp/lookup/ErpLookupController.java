package com.laconic.lacoinvoice.features.erp.lookup;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.web.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/erp-lookups")
@Tag(name = "ERP Lookups")
public class ErpLookupController {

	private final StubErpLookupService lookupService;

	public ErpLookupController(StubErpLookupService lookupService) {
		this.lookupService = lookupService;
	}

	@GetMapping("/items")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "List ERP items (PART_ID). Stub until live ERP is wired.")
	public ApiResponse<List<ErpLookupItemDto>> items(@RequestParam(required = false) String search) {
		return ApiResponse.ok("OK", lookupService.items(search));
	}

	@GetMapping("/items/{id}")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "Get one ERP item by PART_ID")
	public ApiResponse<ErpLookupItemDto> item(@PathVariable Long id) {
		return ApiResponse.ok("OK", lookupService.item(id)
				.orElseThrow(() -> new ResourceNotFoundException("ERP item not found: id=" + id)));
	}

	@GetMapping("/account-codes")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "List ERP GL account codes. Stub until live ERP is wired.")
	public ApiResponse<List<ErpLookupAccountDto>> accounts(@RequestParam(required = false) String search) {
		return ApiResponse.ok("OK", lookupService.accounts(search));
	}

	@GetMapping("/account-codes/{id}")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "Get one ERP GL account by ACCOUNT_ID")
	public ApiResponse<ErpLookupAccountDto> account(@PathVariable Long id) {
		return ApiResponse.ok("OK", lookupService.account(id)
				.orElseThrow(() -> new ResourceNotFoundException("ERP account not found: id=" + id)));
	}

	@GetMapping("/vendors")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "List ERP vendors. Stub until live ERP is wired.")
	public ApiResponse<List<ErpLookupVendorDto>> vendors(@RequestParam(required = false) String search) {
		return ApiResponse.ok("OK", lookupService.vendors(search));
	}

	@GetMapping("/vendors/{id}")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "Get one ERP vendor by VENDOR_ID")
	public ApiResponse<ErpLookupVendorDto> vendor(@PathVariable Long id) {
		return ApiResponse.ok("OK", lookupService.vendor(id)
				.orElseThrow(() -> new ResourceNotFoundException("ERP vendor not found: id=" + id)));
	}

	@GetMapping("/departments")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "List ERP departments. Stub until live ERP is wired.")
	public ApiResponse<List<ErpLookupDepartmentDto>> departments(@RequestParam(required = false) String search) {
		return ApiResponse.ok("OK", lookupService.departments(search));
	}

	@GetMapping("/departments/{id}")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "Get one ERP department by DEPARTMENT_ID")
	public ApiResponse<ErpLookupDepartmentDto> department(@PathVariable Long id) {
		return ApiResponse.ok("OK", lookupService.department(id)
				.orElseThrow(() -> new ResourceNotFoundException("ERP department not found: id=" + id)));
	}

	@GetMapping("/currencies")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "List ERP currencies. Stub until live ERP is wired.")
	public ApiResponse<List<ErpLookupCurrencyDto>> currencies(@RequestParam(required = false) String search) {
		return ApiResponse.ok("OK", lookupService.currencies(search));
	}

	@GetMapping("/currencies/{id}")
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	@Operation(summary = "Get one ERP currency by CURRENCY_ID")
	public ApiResponse<ErpLookupCurrencyDto> currency(@PathVariable Long id) {
		return ApiResponse.ok("OK", lookupService.currency(id)
				.orElseThrow(() -> new ResourceNotFoundException("ERP currency not found: id=" + id)));
	}
}
