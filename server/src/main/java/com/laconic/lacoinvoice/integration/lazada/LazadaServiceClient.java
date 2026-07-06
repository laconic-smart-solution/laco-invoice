package com.laconic.lacoinvoice.integration.lazada;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.laconic.lacoinvoice.config.CommunicationProperties;
import com.laconic.lacoinvoice.integration.marketplace.AbstractMarketplaceGatewayClient;

@Component
public class LazadaServiceClient extends AbstractMarketplaceGatewayClient {

	private static final String MARKETPLACE_CODE = "LAZADA";

	public LazadaServiceClient(
			@Qualifier("marketplaceRestClient") RestClient restClient,
			CommunicationProperties properties) {
		super(restClient, properties, "Lazada service", properties.getLazadaBasePath());
	}

	@Override
	public String marketplaceCode() {
		return MARKETPLACE_CODE;
	}
}
