package com.laconic.lacoinvoice.features.marketplace;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/marketplaces")
@Tag(name = "Marketplaces")
public class MarketplaceController {

	private final MarketplaceService service;

	public MarketplaceController(MarketplaceService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(summary = "List all marketplaces")
	public ApiResponse<List<MarketplaceDto>> getAll() {
		List<MarketplaceDto> items = service.getAll();
		PageMeta meta = new PageMeta(0, items.size(), items.size(), items.isEmpty() ? 0 : 1);
		return ApiResponse.ok("OK", items, meta);
	}
}
