package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.integration.shopee.ShopeeServiceClient;

@Component
public class ShopeeMarketplaceOrderAdapter extends AbstractMarketplaceOrderAdapter {

	private final ShopeeServiceClient client;

	public ShopeeMarketplaceOrderAdapter(ShopeeServiceClient client) {
		super("SHOPEE");
		this.client = client;
	}

	@Override
	protected List<GatewayOrderData> fetchFromGateway(StoreMarketplaceConnection connection, String updatedFrom) {
		Long storeId = connection.getStore().getId();
		UUID tenantId = MarketplaceScopeSupport.toTenantUuid(storeId);
		return client.listOrders(tenantId, connection.getAccessToken(), connection.getExternalSellerId(), updatedFrom);
	}
}
