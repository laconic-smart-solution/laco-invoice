package com.laconic.lacoinvoice.integration.marketplace.product;

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

	@Override
	public GatewayProductDetail fetchProductDetail(
			StoreMarketplaceConnection connection,
			String externalProductId,
			String sku) {
		if (connection.getExternalConnectionId() == null) {
			log.warn("Skipping product detail for {} connection without external id", marketplaceCode);
			throw new com.laconic.lacoinvoice.common.exception.ResourceNotFoundException("Product not found.");
		}
		if (connection.getAccessToken() == null || connection.getAccessToken().isBlank()) {
			log.warn("Skipping product detail for {} connection without access token", marketplaceCode);
			throw new com.laconic.lacoinvoice.common.exception.ResourceNotFoundException("Product not found.");
		}
		try {
			return fetchProductDetailFromGateway(connection, externalProductId, sku);
		} catch (com.laconic.lacoinvoice.common.exception.ResourceNotFoundException e) {
			throw e;
		} catch (Exception e) {
			log.error("Failed to fetch {} product detail for storeId={} productId={}",
					marketplaceCode,
					connection.getStore() != null ? connection.getStore().getId() : null,
					externalProductId,
					e);
			throw new com.laconic.lacoinvoice.common.exception.ResourceNotFoundException("Product not found.");
		}
	}

	protected GatewayProductDetail fetchProductDetailFromGateway(
			StoreMarketplaceConnection connection,
			String externalProductId,
			String sku) {
		throw new com.laconic.lacoinvoice.common.exception.ResourceNotFoundException(
				"Product detail is not supported for marketplace: " + marketplaceCode);
	}

	protected abstract MarketplaceProductPage fetchPageFromGateway(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search);
}
