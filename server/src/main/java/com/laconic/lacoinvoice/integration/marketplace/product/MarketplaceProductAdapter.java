package com.laconic.lacoinvoice.integration.marketplace.product;

import java.util.List;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

public interface MarketplaceProductAdapter {

	boolean supports(String marketplaceCode);

	List<GatewayProductData> fetchProducts(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search);

	GatewayProductDetail fetchProductDetail(
			StoreMarketplaceConnection connection,
			String externalProductId,
			String sku);

	default MarketplaceProductPage fetchProductPage(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search) {
		List<GatewayProductData> items = fetchProducts(connection, page, limit, search);
		return new MarketplaceProductPage(items, items.size());
	}
}
