package com.laconic.lacoinvoice.integration.marketplace.client;

import java.util.List;
import java.util.UUID;

import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductDetailData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductListData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;
import com.laconic.lacoinvoice.integration.marketplace.order.GatewayOrderData;
public interface MarketplaceGatewayClient {

	String marketplaceCode();

	String getAuthorizeUrl(UUID tenantId, UUID actorId, String state);

	GatewayStoreData connect(UUID tenantId, UUID actorId, String code, String displayName, String shopId);

	GatewayStoreData refresh(UUID tenantId, UUID actorId, String refreshToken, String shopId);

	List<GatewayOrderData> listOrders(
			UUID tenantId,
			String accessToken,
			String sellerId,
			String updatedFrom,
			int page,
			int limit);

	GatewayProductListData listProducts(
			UUID tenantId,
			String accessToken,
			String sellerId,
			int page,
			int limit,
			String search);

	GatewayProductDetailData getProduct(
			UUID tenantId,
			String accessToken,
			String sellerId,
			String externalProductId,
			String sku);
}
