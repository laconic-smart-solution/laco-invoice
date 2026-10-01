package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MarketplaceProductVariantDto")
public record MarketplaceProductVariantDto(
		String sku,
		String price,
		String currency,
		String status,
		String quantity) {
}
