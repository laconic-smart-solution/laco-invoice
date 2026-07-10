package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MarketplaceProductErpDetailDto")
public record MarketplaceProductErpDetailDto(
		String status,
		Long localProductId,
		Long erpItemId,
		String erpSku,
		String erpName,
		Instant mappedAt) {
}
