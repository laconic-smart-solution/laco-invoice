package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;
import java.util.List;

public record ManualInvoicePreviewDto(
		int itemCount,
		BigDecimal subtotal,
		BigDecimal vatRate,
		BigDecimal vatAmount,
		BigDecimal grandTotal,
		String currency,
		List<ManualInvoiceLineDto> lines) {
}
