package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;
import java.util.UUID;

import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;

public interface MarketplaceGatewayClient {

	String marketplaceCode();

	String getAuthorizeUrl(UUID tenantId, UUID actorId, String state);

	GatewayStoreData connect(UUID tenantId, UUID actorId, String code, String displayName, String shopId);

	GatewayStoreData refresh(UUID tenantId, UUID actorId, String refreshToken, String shopId);

	List<GatewayOrderData> listOrders(UUID tenantId, String accessToken, String sellerId, String updatedFrom);
}
