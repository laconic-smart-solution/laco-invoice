package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderStatsDto")
public record OrderStatsDto(
		long totalOrders,
		long invoicedOrders,
		long awaitingInvoice,
		double invoiceCoveragePercent,
		BigDecimal totalRevenue,
		BigDecimal totalFees,
		BigDecimal totalAdjustments) {
}
