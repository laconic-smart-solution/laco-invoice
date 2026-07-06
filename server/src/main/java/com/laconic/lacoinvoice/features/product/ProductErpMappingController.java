package com.laconic.lacoinvoice.features.product;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.erp.ErpItemService;
import com.laconic.lacoinvoice.features.erp.ErpMappingRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product ERP Mapping")
public class ProductErpMappingController {

	private final ErpItemService erpItemService;

	public ProductErpMappingController(ErpItemService erpItemService) {
		this.erpItemService = erpItemService;
	}

	@PostMapping("/{productId}/erp-mapping")
	@Operation(summary = "Create ERP mapping for product")
	public ResponseEntity<ApiResponse<Void>> createMapping(
			@PathVariable Long productId,
			@RequestBody @Valid ErpMappingRequest request) {
		erpItemService.createProductMapping(productId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Mapping created", null));
	}

	@DeleteMapping("/{productId}/erp-mapping/{mappingId}")
	@Operation(summary = "Delete ERP mapping for product")
	public ResponseEntity<ApiResponse<Void>> deleteMapping(
			@PathVariable Long productId,
			@PathVariable Long mappingId) {
		erpItemService.deleteProductMapping(productId, mappingId);
		return ResponseEntity.ok(ApiResponse.ok("Mapping deleted"));
	}
}
