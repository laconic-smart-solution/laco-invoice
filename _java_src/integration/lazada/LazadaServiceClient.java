package com.laconic.lacoinvoice.integration.lazada;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.config.CommunicationProperties;
import com.laconic.lacoinvoice.integration.marketplace.client.AbstractMarketplaceGatewayClient;

@Component
public class LazadaServiceClient extends AbstractMarketplaceGatewayClient {

	private static final String MARKETPLACE_CODE = "LAZADA";
	private static final String HEADER_APP_KEY = "X-Lazada-App-Key";
	private static final String HEADER_APP_SECRET = "X-Lazada-App-Secret";

	public LazadaServiceClient(
			@Qualifier("marketplaceRestClient") RestClient restClient,
			CommunicationProperties properties) {
		super(restClient, properties, "Lazada service", properties.getLazadaBasePath());
	}

	@Override
	public String marketplaceCode() {
		return MARKETPLACE_CODE;
	}

	@Override
	protected RestClient.RequestHeadersSpec<?> applyVendorHeaders(RestClient.RequestHeadersSpec<?> request) {
		CommunicationProperties props = properties();
		String appKey = props.getLazadaAppKey();
		String appSecret = props.getLazadaAppSecret();
		if (!StringUtils.hasText(appKey) || !StringUtils.hasText(appSecret)) {
			throw new BadGatewayException(
					"Lazada app credentials are not configured. Set LAZADA_APP_KEY and LAZADA_APP_SECRET on laco-invoice.");
		}
		return request
				.header(HEADER_APP_KEY, appKey.trim())
				.header(HEADER_APP_SECRET, appSecret.trim());
	}
}
