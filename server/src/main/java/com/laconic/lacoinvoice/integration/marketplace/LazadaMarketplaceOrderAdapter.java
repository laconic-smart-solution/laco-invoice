package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.integration.lazada.LazadaServiceClient;

@Component
public class LazadaMarketplaceOrderAdapter extends AbstractMarketplaceOrderAdapter {

	private final LazadaServiceClient client;

	public LazadaMarketplaceOrderAdapter(LazadaServiceClient client) {
		super("LAZADA");
		this.client = client;
	}

	@Override
	protected List<GatewayOrderData> fetchFromGateway(StoreMarketplaceConnection connection, String updatedFrom) {
		Long storeId = connection.getStore().getId();
		UUID tenantId = MarketplaceScopeSupport.toTenantUuid(storeId);
		return client.listOrders(tenantId, connection.getExternalConnectionId(), updatedFrom);
	}
}
