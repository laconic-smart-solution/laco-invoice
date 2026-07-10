package com.laconic.lacoinvoice.integration.marketplace.product;

import java.util.List;

public record GatewayProductDetail(
		String externalProductId,
		String sku,
		String name,
		String description,
		String price,
		String currency,
		String status,
		List<String> images,
		List<GatewayProductVariant> variants) {

	public record GatewayProductVariant(
			String sku,
			String price,
			String currency,
			String status,
			String quantity) {
	}
}
