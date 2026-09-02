package com.laconic.lacoinvoice.features.order.inputrun;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoicePdfExtract(
		String receiptNumber,
		LocalDate receiptDate,
		LocalDate periodStart,
		LocalDate periodEnd,
		String issuerName,
		String issuerTaxId,
		String buyerName,
		String buyerTaxId,
		BigDecimal totalAmount,
		BigDecimal withholdingTaxAmount,
		BigDecimal withholdingTaxRate,
		String rawText) {
}
