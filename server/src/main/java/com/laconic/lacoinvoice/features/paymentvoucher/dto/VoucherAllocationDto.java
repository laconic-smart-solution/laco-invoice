package com.laconic.lacoinvoice.features.paymentvoucher.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record VoucherAllocationDto(
		Long id,
		Long voucherId,
		Long orderId,
		String externalOrderId,
		Long invoiceId,
		String invoiceNumber,
		BigDecimal orderTotalAmount,
		BigDecimal allocatedAmount,
		BigDecimal previousPaidAmount,
		BigDecimal remainingBalance,
		String buyerName,
		Instant allocatedAt,
		String notes) {
}
