package com.laconic.lacoinvoice.integration.marketplace.order;

import java.time.Instant;
import java.util.List;

public record GatewayOrderData(
		String externalOrderId,
		String status,
		String totalAmount,
		String currency,
		Instant orderedAt,
		String customerName,
		String customerEmail,
		String customerPhone,
		String customerAddress,
		List<GatewayOrderLineItem> items) {
}
