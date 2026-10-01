package com.laconic.lacoinvoice.features.store.tiktok;

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
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceAuthorizeUrlDto;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectRequest;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectionService;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectionViewDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/tiktok")
@Tag(name = "Store TikTok connections")
@Validated
public class StoreTikTokController {

	private static final String MARKETPLACE_CODE = "TIKTOK";

	private final StoreMarketplaceConnectionService service;

	public StoreTikTokController(StoreMarketplaceConnectionService service) {
		this.service = service;
	}

	@GetMapping("/authorize-url")
	@Operation(summary = "Get TikTok Shop OAuth authorize URL for store")
	public ApiResponse<StoreMarketplaceAuthorizeUrlDto> getAuthorizeUrl(@PathVariable Long storeId) {
		return ApiResponse.ok("OK", service.getAuthorizeUrl(storeId, MARKETPLACE_CODE));
	}

	@PostMapping("/connect")
	@Operation(summary = "Connect TikTok Shop to store using OAuth code")
	public ResponseEntity<ApiResponse<StoreMarketplaceConnectionDto>> connect(
			@PathVariable Long storeId,
			@RequestBody @Valid StoreMarketplaceConnectRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Connected", service.connect(storeId, MARKETPLACE_CODE, request)));
	}

	@PostMapping("/scrape-connect")
	@Operation(summary = "Register TikTok scrape connection (no Partner OAuth; requires TIKTOK_SHOP_SCRAPPING=true)")
	public ResponseEntity<ApiResponse<StoreMarketplaceConnectionDto>> scrapeConnect(
			@PathVariable Long storeId,
			@RequestBody @Valid TikTokScrapeConnectRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Connected", service.registerTikTokScrapeConnection(storeId, request)));
	}

	@GetMapping("/connections")
	@Operation(summary = "List TikTok connections for store")
	public ApiResponse<List<StoreMarketplaceConnectionViewDto>> listConnections(@PathVariable Long storeId) {
		List<StoreMarketplaceConnectionViewDto> items = service.listConnections(storeId, MARKETPLACE_CODE);
		PageMeta meta = new PageMeta(0, items.size(), items.size(), items.isEmpty() ? 0 : 1);
		return ApiResponse.ok("OK", items, meta);
	}

	@PostMapping("/connections/{externalConnectionId}/refresh")
	@Operation(summary = "Refresh TikTok tokens for store connection")
	public ApiResponse<StoreMarketplaceConnectionDto> refreshConnection(
			@PathVariable Long storeId,
			@PathVariable UUID externalConnectionId) {
		return ApiResponse.ok("Refreshed", service.refreshConnection(storeId, MARKETPLACE_CODE, externalConnectionId));
	}

	@DeleteMapping("/connections/{externalConnectionId}")
	@Operation(summary = "Revoke TikTok store connection")
	public ResponseEntity<ApiResponse<Void>> revokeConnection(
			@PathVariable Long storeId,
			@PathVariable UUID externalConnectionId) {
		service.revokeConnection(storeId, MARKETPLACE_CODE, externalConnectionId);
		return ResponseEntity.ok(ApiResponse.ok("Revoked"));
	}
}
