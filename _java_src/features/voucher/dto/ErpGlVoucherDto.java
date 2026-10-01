package com.laconic.lacoinvoice.features.voucher.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.laconic.lacoinvoice.domain.models.ErpGlVoucherCategory;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherStatus;

public record ErpGlVoucherDto(
		Long id,
		String voucherNumber,
		String voucherRefNo,
		String erpVoucherNo,
		ErpGlVoucherCategory voucherCategory,
		LocalDate voucherDate,
		LocalDate taxMonth,
		LocalDate whtMonth,
		String currency,
		String chequeTransferNumber,
		String voucherBrief,
		String voucherDescription,
		boolean noTaxInvoice,
		String rejectRemark,
		ErpGlVoucherStatus status,
		Long storeId,
		String storeName,
		Long invoiceId,
		String invoiceNumber,
		Long orderInputRunId,
		String orderInputRunTitle,
		Long externalErpItemId,
		Long externalErpAccountCodeId,
		Long externalErpVendorId,
		BigDecimal debitTotal,
		BigDecimal creditTotal,
		String generateError,
		Instant createdAt,
		Instant updatedAt) {
}
