package com.laconic.lacoinvoice.features.marketplaceproduct;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MarketplaceProductDto")
public record MarketplaceProductDto(
		Long id,
		Long storeId,
		String storeName,
		String marketplaceCode,
		String marketplaceName,
		String externalProductId,
		String sku,
		String name,
		String price,
		String currency,
		String status,
		String erpStatus) {
}
