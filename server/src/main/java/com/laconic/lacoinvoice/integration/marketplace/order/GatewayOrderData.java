package com.laconic.lacoinvoice.integration.marketplace.order;

import java.time.Instant;

public record GatewayOrderData(
		String externalOrderId,
		String status,
		String totalAmount,
		String currency,
		Instant orderedAt) {
}
