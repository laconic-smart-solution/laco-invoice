package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceInvoiceLineItemDto")
public record InvoiceLineItemDto(
		Long id,
		String sku,
		String productName,
		BigDecimal price,
		Integer quantity,
		BigDecimal lineTotal) {
}
