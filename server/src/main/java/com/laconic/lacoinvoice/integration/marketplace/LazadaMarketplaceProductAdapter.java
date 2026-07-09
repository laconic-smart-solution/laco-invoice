package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.integration.lazada.LazadaServiceClient;
import com.laconic.lacoinvoice.integration.marketplace.MarketplaceProductPage;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductListData;

@Component
public class LazadaMarketplaceProductAdapter extends AbstractMarketplaceProductAdapter {

	private final LazadaServiceClient client;

	public LazadaMarketplaceProductAdapter(LazadaServiceClient client) {
		super("LAZADA");
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
		List<GatewayProductData> items = data.items().stream().map(this::toProductData).toList();
		return new MarketplaceProductPage(items, total);
	}

	private GatewayProductData toProductData(
			com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductItemData item) {
		return new GatewayProductData(
				item.externalProductId(),
				item.sku(),
				item.name(),
				item.price(),
				item.currency(),
				item.status());
	}
}
