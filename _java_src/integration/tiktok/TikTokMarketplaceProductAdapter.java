package com.laconic.lacoinvoice.integration.tiktok;

import java.util.List;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.integration.marketplace.MarketplaceScopeSupport;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductDetailData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductItemData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductListData;
import com.laconic.lacoinvoice.integration.marketplace.product.AbstractMarketplaceProductAdapter;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductData;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductDetail;
import com.laconic.lacoinvoice.integration.marketplace.product.MarketplaceProductPage;

@Component
public class TikTokMarketplaceProductAdapter extends AbstractMarketplaceProductAdapter {

	private final TikTokServiceClient client;

	public TikTokMarketplaceProductAdapter(TikTokServiceClient client) {
		super("TIKTOK");
		this.client = client;
	}

	@Override
	protected MarketplaceProductPage fetchPageFromGateway(
			StoreMarketplaceConnection connection,
			int page,
			int limit,
			String search) {
		Long storeId = connection.getStore().getId();
		GatewayProductListData data = client.listProducts(
				MarketplaceScopeSupport.toTenantUuid(storeId),
				connection.getAccessToken(),
				connection.getExternalSellerId(),
				page,
				limit,
				search);
		if (data == null || data.items() == null) {
			return new MarketplaceProductPage(List.of(), 0);
		}
		int total = data.total() != null ? data.total() : data.items().size();
		List<GatewayProductData> items = data.items().stream().map(this::toProductData).toList();
		return new MarketplaceProductPage(items, total);
	}

	@Override
	protected GatewayProductDetail fetchProductDetailFromGateway(
			StoreMarketplaceConnection connection,
			String externalProductId,
			String sku) {
		Long storeId = connection.getStore().getId();
		GatewayProductDetailData data = client.getProduct(
				MarketplaceScopeSupport.toTenantUuid(storeId),
				connection.getAccessToken(),
				connection.getExternalSellerId(),
				externalProductId,
				sku);
		if (data == null) {
			throw new com.laconic.lacoinvoice.common.exception.ResourceNotFoundException("Product not found.");
		}
		return toProductDetail(data);
	}

	private GatewayProductDetail toProductDetail(GatewayProductDetailData data) {
		java.util.List<GatewayProductDetail.GatewayProductVariant> variants = data.variants() == null
				? java.util.List.of()
				: data.variants().stream()
						.map(variant -> new GatewayProductDetail.GatewayProductVariant(
								variant.sku(),
								variant.price(),
								variant.currency(),
								variant.status(),
								variant.quantity()))
						.toList();
		return new GatewayProductDetail(
				data.externalProductId(),
				data.sku(),
				data.name(),
				data.description(),
				data.price(),
				data.currency(),
				data.status(),
				data.images() != null ? data.images() : java.util.List.of(),
				variants);
	}

	private GatewayProductData toProductData(GatewayProductItemData item) {
		return new GatewayProductData(
				item.externalProductId(),
				item.sku(),
				item.name(),
				item.price(),
				item.currency(),
				item.status());
	}
}
