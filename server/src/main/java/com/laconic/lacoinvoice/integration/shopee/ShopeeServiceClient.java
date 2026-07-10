package com.laconic.lacoinvoice.integration.shopee;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.laconic.lacoinvoice.config.CommunicationProperties;
import com.laconic.lacoinvoice.integration.marketplace.client.AbstractMarketplaceGatewayClient;

@Component
public class ShopeeServiceClient extends AbstractMarketplaceGatewayClient {

	private static final String MARKETPLACE_CODE = "SHOPEE";

	public ShopeeServiceClient(
			@Qualifier("marketplaceRestClient") RestClient restClient,
			CommunicationProperties properties) {
		super(restClient, properties, "Shopee service", properties.getShopeeBasePath());
	}

	@Override
	public String marketplaceCode() {
		return MARKETPLACE_CODE;
	}
}
