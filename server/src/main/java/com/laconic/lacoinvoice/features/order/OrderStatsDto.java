package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "High-level invoicing metrics for order management")
public record OrderStatsDto(
		long totalOrders,
		BigDecimal totalRevenue,
		BigDecimal totalFees,
		BigDecimal totalAdsFee) {
}
