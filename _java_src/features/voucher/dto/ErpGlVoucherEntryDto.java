package com.laconic.lacoinvoice.features.voucher.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ErpGlVoucherEntryDto(
		Long id,
		Long externalErpAccountCodeId,
		BigDecimal debit,
		BigDecimal credit,
		String invoiceNo,
		LocalDate invoiceDate,
		String note,
		Long externalErpVendorId,
		Long externalErpDepartmentId,
		Long externalErpCurrencyId,
		BigDecimal exchangeRate) {
}
