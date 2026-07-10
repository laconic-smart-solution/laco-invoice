package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MarketplaceProductDetailDto")
public record MarketplaceProductDetailDto(
		Long storeId,
		String storeName,
		String marketplaceCode,
		String marketplaceName,
		String externalProductId,
		String sku,
		String name,
		String description,
		String price,
		String currency,
		String status,
		List<String> images,
		List<MarketplaceProductVariantDto> variants,
		MarketplaceProductErpDetailDto erp) {
}
