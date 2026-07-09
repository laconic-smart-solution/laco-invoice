package com.laconic.lacoinvoice.integration.marketplace;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

public abstract class AbstractMarketplaceProductAdapter implements MarketplaceProductAdapter {

	private static final Logger log = LoggerFactory.getLogger(AbstractMarketplaceProductAdapter.class);

	private final String marketplaceCode;

	protected AbstractMarketplaceProductAdapter(String marketplaceCode) {
		this.marketplaceCode = marketplaceCode;
	}

	@Override
	public boolean supports(String code) {
		return code != null && marketplaceCode.equalsIgnoreCase(code.trim());
	}

	@Override
	public MarketplaceProductPage fetchProductPage(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search) {
		if (connection.getExternalConnectionId() == null) {
			log.warn("Skipping product fetch for {} connection without external id", marketplaceCode);
			return new MarketplaceProductPage(Collections.emptyList(), 0);
		}
		if (connection.getAccessToken() == null || connection.getAccessToken().isBlank()) {
			log.warn("Skipping product fetch for {} connection without access token", marketplaceCode);
			return new MarketplaceProductPage(Collections.emptyList(), 0);
		}
		try {
			return fetchPageFromGateway(connection, page, limit, search);
		} catch (Exception e) {
			log.error("Failed to fetch {} products for storeId={}", marketplaceCode,
					connection.getStore() != null ? connection.getStore().getId() : null, e);
			return new MarketplaceProductPage(Collections.emptyList(), 0);
		}
	}

	@Override
	public List<GatewayProductData> fetchProducts(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search) {
		return fetchProductPage(connection, page, limit, search).items();
	}

	protected abstract MarketplaceProductPage fetchPageFromGateway(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search);
}
