package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/marketplace-products")
@Tag(name = "Marketplace products")
public class MarketplaceProductController {

	private final MarketplaceProductService service;

	public MarketplaceProductController(MarketplaceProductService service) {
		this.service = service;
	}

	@GetMapping("/sources")
	@Operation(summary = "List connected marketplace product sources")
	public ApiResponse<List<MarketplaceProductSourceDto>> listSources() {
		return ApiResponse.ok("OK", service.listSources());
	}

	@GetMapping
	@Operation(summary = "List marketplace products for a connected store source")
	public ApiResponse<List<MarketplaceProductDto>> listProducts(
			@RequestParam Long storeId,
			@RequestParam String marketplaceCode,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit,
			@RequestParam(required = false) String search,
			@RequestParam(required = false) BigDecimal priceMin,
			@RequestParam(required = false) BigDecimal priceMax) {
		MarketplaceProductService.MarketplaceProductPageResult result = service.listProducts(
				storeId,
				marketplaceCode,
				page,
				limit,
				search,
				priceMin,
				priceMax);
		return ApiResponse.ok("OK", result.items(), result.meta());
	}
}
