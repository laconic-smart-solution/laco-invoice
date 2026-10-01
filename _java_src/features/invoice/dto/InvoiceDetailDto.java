package com.laconic.lacoinvoice.features.invoice.dto;

import java.util.List;

public record InvoiceDetailDto(
		InvoiceDto invoice,
		List<InvoiceOrderSummaryDto> orders,
		List<InvoiceItemLineDto> items,
		InvoicePaymentSummaryDto paymentSummary) {
}
