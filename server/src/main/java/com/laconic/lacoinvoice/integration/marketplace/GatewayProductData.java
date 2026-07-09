package com.laconic.lacoinvoice.integration.marketplace;

public record GatewayProductData(
		String externalProductId,
		String sku,
		String name,
		String price,
		String currency,
		String status) {
}
