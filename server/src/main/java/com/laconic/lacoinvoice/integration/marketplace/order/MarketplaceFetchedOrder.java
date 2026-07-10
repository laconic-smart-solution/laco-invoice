package com.laconic.lacoinvoice.integration.marketplace.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MarketplaceFetchedOrder(
		String externalOrderId,
		String externalOrderDetailJson,
		String orderStatus,
		BigDecimal subtotal,
		BigDecimal shippingFee,
		BigDecimal totalAmount,
		Instant orderDate,
		String customerPhone,
		String customerGender,
		String customerAddress,
		List<MarketplaceFetchedOrderItem> items) {
}
