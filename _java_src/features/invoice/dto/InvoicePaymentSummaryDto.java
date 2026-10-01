package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;

import com.laconic.lacoinvoice.domain.models.PaymentAllocationStatus;

public record InvoicePaymentSummaryDto(
		Long invoiceId,
		String invoiceNumber,
		BigDecimal invoiceTotalAmount,
		BigDecimal totalPaidAmount,
		BigDecimal remainingBalance,
		PaymentAllocationStatus status,
		int paidPercentage) {
}
