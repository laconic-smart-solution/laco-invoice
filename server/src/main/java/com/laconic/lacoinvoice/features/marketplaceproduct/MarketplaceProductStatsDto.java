package com.laconic.lacoinvoice.features.marketplaceproduct;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MarketplaceProductStatsDto")
public record MarketplaceProductStatsDto(
		long totalCount,
		long syncedCount,
		long unmappedCount,
		double mappingRatePercent) {
}
