package com.laconic.lacoinvoice.features.marketplace;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceMarketplaceDto")
public record MarketplaceDto(
		Long id,
		String code,
		String name) {
}
