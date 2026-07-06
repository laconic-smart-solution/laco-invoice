package com.laconic.lacoinvoice.integration.tiktok;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.laconic.lacoinvoice.config.CommunicationProperties;
import com.laconic.lacoinvoice.integration.marketplace.AbstractMarketplaceGatewayClient;

@Component
public class TikTokServiceClient extends AbstractMarketplaceGatewayClient {

	private static final String MARKETPLACE_CODE = "TIKTOK";

	public TikTokServiceClient(
			@Qualifier("marketplaceRestClient") RestClient restClient,
			CommunicationProperties properties) {
		super(restClient, properties, "TikTok service", properties.getTiktokBasePath());
	}

	@Override
	public String marketplaceCode() {
		return MARKETPLACE_CODE;
	}
}
