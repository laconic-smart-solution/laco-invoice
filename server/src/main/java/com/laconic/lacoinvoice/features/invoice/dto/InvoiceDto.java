package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.laconic.lacoinvoice.domain.models.InvoiceSourceType;
import com.laconic.lacoinvoice.domain.models.InvoiceStatus;

public record InvoiceDto(
		Long id,
		String invoiceNumber,
		String title,
		Long storeId,
		String storeName,
		Long marketplaceId,
		String marketplaceCode,
		InvoiceSourceType sourceType,
		InvoiceStatus status,
		LocalDate startDate,
		LocalDate endDate,
		Long orderRunId,
		String orderRunTitle,
		int orderCount,
		int itemCount,
		BigDecimal subtotal,
		BigDecimal vatRate,
		BigDecimal vatAmount,
		BigDecimal grandTotal,
		String currency,
		String notes,
		String buyerName,
		String buyerTaxId,
		String buyerAddress,
		Instant issuedAt,
		Instant paidAt,
		Instant createdAt,
		Instant updatedAt) {
}
