package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.InvoiceStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceInvoiceListItemDto")
public record InvoiceListItemDto(
		Long id,
		Long orderId,
		String invoiceNo,
		String storeName,
		String marketplaceCode,
		String customerName,
		String currency,
		BigDecimal grandTotal,
		Integer vatPercentage,
		InvoiceStatus status,
		Instant issuedAt) {
}
