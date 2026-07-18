package com.laconic.lacoinvoice.integration.tiktok;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.config.CommunicationProperties;
import com.laconic.lacoinvoice.integration.marketplace.client.AbstractMarketplaceGatewayClient;

@Component
public class TikTokServiceClient extends AbstractMarketplaceGatewayClient {

	private static final String MARKETPLACE_CODE = "TIKTOK";
	private static final String HEADER_APP_KEY = "X-TikTok-App-Key";
	private static final String HEADER_APP_SECRET = "X-TikTok-App-Secret";

	public TikTokServiceClient(
			@Qualifier("marketplaceRestClient") RestClient restClient,
			CommunicationProperties properties) {
		super(restClient, properties, "TikTok service", properties.getTiktokBasePath());
	}

	@Override
	public String marketplaceCode() {
		return MARKETPLACE_CODE;
	}

	@Override
	protected RestClient.RequestHeadersSpec<?> applyVendorHeaders(RestClient.RequestHeadersSpec<?> request) {
		CommunicationProperties props = properties();
		String appKey = props.getTiktokAppKey();
		String appSecret = props.getTiktokAppSecret();
		if (!StringUtils.hasText(appKey) || !StringUtils.hasText(appSecret)) {
			throw new BadGatewayException(
					"TikTok app credentials are not configured. Set TIKTOK_APP_KEY and TIKTOK_APP_SECRET on laco-invoice.");
		}
		return request
				.header(HEADER_APP_KEY, appKey.trim())
				.header(HEADER_APP_SECRET, appSecret.trim());
	}
}
