package com.laconic.lacoinvoice.integration.marketplace.product;

public record GatewayProductData(
		String externalProductId,
		String sku,
		String name,
		String price,
		String currency,
		String status) {
}
