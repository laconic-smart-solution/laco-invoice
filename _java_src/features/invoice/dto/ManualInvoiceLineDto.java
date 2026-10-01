package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;

public record ManualInvoiceLineDto(
		String productName,
		String description,
		String sku,
		Integer quantity,
		BigDecimal unitPrice,
		BigDecimal discount,
		BigDecimal subtotal,
		BigDecimal totalAmount) {
}
