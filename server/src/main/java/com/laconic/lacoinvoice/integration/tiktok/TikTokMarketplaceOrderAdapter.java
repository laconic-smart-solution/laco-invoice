package com.laconic.lacoinvoice.integration.tiktok;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.integration.marketplace.MarketplaceScopeSupport;
import com.laconic.lacoinvoice.integration.marketplace.order.AbstractMarketplaceOrderAdapter;
import com.laconic.lacoinvoice.integration.marketplace.order.GatewayOrderData;

@Component
public class TikTokMarketplaceOrderAdapter extends AbstractMarketplaceOrderAdapter {

	private final TikTokServiceClient client;

	public TikTokMarketplaceOrderAdapter(TikTokServiceClient client) {
		super("TIKTOK");
		this.client = client;
	}

	@Override
	protected List<GatewayOrderData> fetchFromGateway(
			StoreMarketplaceConnection connection,
			String updatedFrom,
			int page,
			int limit) {
		Long storeId = connection.getStore().getId();
		UUID tenantId = MarketplaceScopeSupport.toTenantUuid(storeId);
		return client.listOrders(
				tenantId,
				connection.getAccessToken(),
				connection.getExternalSellerId(),
				updatedFrom,
				page,
				limit);
	}
}
