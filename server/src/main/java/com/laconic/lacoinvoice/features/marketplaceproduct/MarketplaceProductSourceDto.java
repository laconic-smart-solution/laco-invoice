package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MarketplaceProductSourceDto")
public record MarketplaceProductSourceDto(
		Long storeId,
		String storeName,
		String marketplaceCode,
		String marketplaceName,
		UUID externalConnectionId,
		String label,
		String country) {
}
