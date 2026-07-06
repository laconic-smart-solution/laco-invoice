package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;
import java.util.UUID;

import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;

public interface MarketplaceGatewayClient {

	String marketplaceCode();

	String getAuthorizeUrl(UUID tenantId, UUID actorId, String state);

	GatewayStoreData connect(UUID tenantId, UUID actorId, String code, String displayName, String shopId);

	List<GatewayStoreData> listStores(UUID tenantId, UUID actorId);

	GatewayStoreData refresh(UUID tenantId, UUID actorId, UUID externalStoreId);

	void revoke(UUID tenantId, UUID actorId, UUID externalStoreId);

	List<GatewayOrderData> listOrders(UUID tenantId, UUID externalStoreId, String updatedFrom);
}
