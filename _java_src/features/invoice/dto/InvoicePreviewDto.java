package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;

/** Aggregation preview shown before an invoice is actually created. */
public record InvoicePreviewDto(
		int orderCount,
		int itemCount,
		BigDecimal subtotal,
		BigDecimal vatRate,
		BigDecimal vatAmount,
		BigDecimal grandTotal,
		String currency,
		int skippedAlreadyBilledCount) {
}
