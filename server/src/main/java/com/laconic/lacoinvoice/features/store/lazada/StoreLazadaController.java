package com.laconic.lacoinvoice.features.store.lazada;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.features.store.StoreMarketplaceConnectionDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/lazada")
@Tag(name = "Store Lazada connections")
@Validated
public class StoreLazadaController {

	private final StoreLazadaService service;

	public StoreLazadaController(StoreLazadaService service) {
		this.service = service;
	}

	@GetMapping("/authorize-url")
	@Operation(summary = "Get Lazada OAuth authorize URL for store")
	public ApiResponse<StoreLazadaAuthorizeUrlDto> getAuthorizeUrl(@PathVariable Long storeId) {
		return ApiResponse.ok("OK", service.getAuthorizeUrl(storeId));
	}

	@PostMapping("/connect")
	@Operation(summary = "Connect Lazada seller to store using OAuth code")
	public ResponseEntity<ApiResponse<StoreMarketplaceConnectionDto>> connect(
			@PathVariable Long storeId,
			@RequestBody @Valid StoreLazadaConnectRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Connected", service.connect(storeId, request)));
	}

	@GetMapping("/connections")
	@Operation(summary = "List Lazada connections for store")
	public ApiResponse<List<StoreLazadaConnectionDto>> listConnections(@PathVariable Long storeId) {
		List<StoreLazadaConnectionDto> items = service.listConnections(storeId);
		PageMeta meta = new PageMeta(0, items.size(), items.size(), items.isEmpty() ? 0 : 1);
		return ApiResponse.ok("OK", items, meta);
	}

	@PostMapping("/connections/{externalConnectionId}/refresh")
	@Operation(summary = "Refresh Lazada tokens for store connection")
	public ApiResponse<StoreMarketplaceConnectionDto> refreshConnection(
			@PathVariable Long storeId,
			@PathVariable UUID externalConnectionId) {
		return ApiResponse.ok("Refreshed", service.refreshConnection(storeId, externalConnectionId));
	}

	@DeleteMapping("/connections/{externalConnectionId}")
	@Operation(summary = "Revoke Lazada store connection")
	public ResponseEntity<ApiResponse<Void>> revokeConnection(
			@PathVariable Long storeId,
			@PathVariable UUID externalConnectionId) {
		service.revokeConnection(storeId, externalConnectionId);
		return ResponseEntity.ok(ApiResponse.ok("Revoked"));
	}
}
