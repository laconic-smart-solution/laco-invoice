package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.laconic.lacoinvoice.domain.models.PaymentAllocationStatus;

public record InvoiceOrderSummaryDto(
		Long orderId,
		String externalOrderId,
		LocalDate orderDate,
		int itemCount,
		BigDecimal totalAmount,
		BigDecimal vatAmount,
		BigDecimal amountExVat,
		String buyerName,
		String buyerTaxId,
		BigDecimal totalPaidAmount,
		BigDecimal remainingBalance,
		PaymentAllocationStatus paymentStatus) {
}
