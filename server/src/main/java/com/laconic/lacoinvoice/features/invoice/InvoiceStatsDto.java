package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceInvoiceStatsDto")
public record InvoiceStatsDto(
		long issuedCount,
		long voidedCount,
		BigDecimal issuedGrandTotal) {
}
