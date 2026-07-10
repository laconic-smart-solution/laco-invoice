package com.laconic.lacoinvoice.integration.tiktok;

import java.util.List;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.integration.marketplace.MarketplaceScopeSupport;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductListData;
import com.laconic.lacoinvoice.integration.marketplace.product.AbstractMarketplaceProductAdapter;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductData;
import com.laconic.lacoinvoice.integration.marketplace.product.MarketplaceProductPage;

@Component
public class TikTokMarketplaceProductAdapter extends AbstractMarketplaceProductAdapter {

	private final TikTokServiceClient client;

	public TikTokMarketplaceProductAdapter(TikTokServiceClient client) {
		super("TIKTOK");
		this.client = client;
	}

	@Override
	protected MarketplaceProductPage fetchPageFromGateway(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search) {
		Long storeId = connection.getStore().getId();
		GatewayProductListData data = client.listProducts(
				MarketplaceScopeSupport.toTenantUuid(storeId),
				connection.getAccessToken(),
				connection.getExternalSellerId(),
				page,
				limit,
				search);
		if (data == null || data.items() == null) {
			return new MarketplaceProductPage(List.of(), 0);
		}
		int total = data.total() != null ? data.total() : data.items().size();
		List<GatewayProductData> items = data.items().stream()
				.map(item -> new GatewayProductData(
						item.externalProductId(),
						item.sku(),
						item.name(),
						item.price(),
						item.currency(),
						item.status()))
				.toList();
		return new MarketplaceProductPage(items, total);
	}
}
