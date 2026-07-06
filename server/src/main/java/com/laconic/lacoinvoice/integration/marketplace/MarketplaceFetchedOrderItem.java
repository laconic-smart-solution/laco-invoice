package com.laconic.lacoinvoice.integration.marketplace;

import java.math.BigDecimal;

public record MarketplaceFetchedOrderItem(
		String sku,
		String productName,
		BigDecimal price,
		int quantity,
		BigDecimal lineTotal,
		Long productId) {
}
