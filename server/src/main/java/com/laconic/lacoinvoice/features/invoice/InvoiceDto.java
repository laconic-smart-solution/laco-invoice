package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.InvoiceStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceInvoiceDto")
public record InvoiceDto(
		Long id,
		Long orderId,
		String invoiceNo,
		BigDecimal subtotal,
		BigDecimal vatAmount,
		Integer vatPercentage,
		BigDecimal grandTotal,
		InvoiceStatus status,
		String pdfUrl,
		Instant issuedAt,
		Instant createdAt) {
}
