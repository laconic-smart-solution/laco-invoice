package com.laconic.lacoinvoice.features.tiktokscrape;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.config.CommunicationProperties;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * Service-to-service endpoints for tiktok-shop-scrape (auth: X-Gateway-Secret).
 */
@RestController
@RequestMapping("/api/v1/internal/tiktok-seller-sessions")
@Tag(name = "TikTok seller scrape sessions (internal)")
@Validated
public class TikTokSellerSessionController {

	private final TikTokSellerSessionService service;
	private final CommunicationProperties communicationProperties;

	public TikTokSellerSessionController(
			TikTokSellerSessionService service,
			CommunicationProperties communicationProperties) {
		this.service = service;
		this.communicationProperties = communicationProperties;
	}

	@PostMapping
	@Operation(summary = "Upsert Playwright storage_state for a TikTok seller")
	public ResponseEntity<ApiResponse<TikTokSellerSessionDto>> upsert(
			@RequestHeader(value = "X-Gateway-Secret", required = false) String gatewaySecret,
			@RequestBody @Valid TikTokSellerSessionUpsertRequest request) {
		requireGatewaySecret(gatewaySecret);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Saved", service.upsert(request)));
	}

	@GetMapping("/{sellerId}")
	@Operation(summary = "Get TikTok seller scrape session")
	public ApiResponse<TikTokSellerSessionDto> get(
			@RequestHeader(value = "X-Gateway-Secret", required = false) String gatewaySecret,
			@PathVariable String sellerId,
			@RequestParam(defaultValue = "true") boolean includeStorageState) {
		requireGatewaySecret(gatewaySecret);
		return ApiResponse.ok("OK", service.getBySellerId(sellerId, includeStorageState));
	}

	@GetMapping
	@Operation(summary = "List TikTok seller scrape sessions")
	public ApiResponse<List<TikTokSellerSessionDto>> list(
			@RequestHeader(value = "X-Gateway-Secret", required = false) String gatewaySecret,
			@RequestParam(defaultValue = "false") boolean includeStorageState) {
		requireGatewaySecret(gatewaySecret);
		return ApiResponse.ok("OK", service.list(includeStorageState));
	}

	private void requireGatewaySecret(String gatewaySecret) {
		String expected = communicationProperties.getGatewaySecret();
		if (!StringUtils.hasText(expected)) {
			return;
		}
		if (!expected.equals(gatewaySecret != null ? gatewaySecret.trim() : null)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid gateway secret");
		}
	}
}
