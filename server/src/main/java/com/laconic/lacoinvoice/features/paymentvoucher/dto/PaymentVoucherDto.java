package com.laconic.lacoinvoice.features.paymentvoucher.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.VoucherPaymentMethod;
import com.laconic.lacoinvoice.domain.models.VoucherStatus;

public record PaymentVoucherDto(
		Long id,
		String voucherNumber,
		LocalDate date,
		Long storeId,
		String storeName,
		String customerName,
		String customerTaxId,
		BigDecimal totalAmount,
		BigDecimal allocatedAmount,
		BigDecimal unallocatedAmount,
		VoucherPaymentMethod paymentMethod,
		String bankReference,
		String proofFileUrl,
		String notes,
		VoucherStatus status,
		Instant createdAt,
		Instant updatedAt,
		List<VoucherAllocationDto> allocations) {
}
