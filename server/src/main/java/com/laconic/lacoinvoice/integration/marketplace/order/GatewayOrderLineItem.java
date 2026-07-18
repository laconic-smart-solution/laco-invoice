package com.laconic.lacoinvoice.integration.marketplace.order;

import java.math.BigDecimal;

public record GatewayOrderLineItem(
		String sku,
		String productName,
		BigDecimal price,
		int quantity,
		BigDecimal lineTotal) {
}
