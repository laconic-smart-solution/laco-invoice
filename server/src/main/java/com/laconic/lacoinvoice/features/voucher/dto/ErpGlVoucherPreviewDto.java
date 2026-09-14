package com.laconic.lacoinvoice.features.voucher.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.ErpGlVoucherCategory;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupItemFinanceAccountDto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceErpGlVoucherPreviewDto")
public record ErpGlVoucherPreviewDto(
		Long storeId,
		String storeName,
		Long orderInputRunId,
		String orderInputRunTitle,
		ErpGlVoucherCategory voucherCategory,
		LocalDate voucherDate,
		LocalDate taxMonth,
		LocalDate whtMonth,
		String currency,
		String voucherBrief,
		String voucherDescription,
		Boolean noTaxInvoice,
		Long externalErpItemId,
		String itemCode,
		String itemName,
		Long externalErpAccountCodeId,
		String accountCode,
		String accountTitle,
		Long externalErpVendorId,
		String vendorCode,
		String vendorName,
		Long externalErpDepartmentId,
		Long externalErpCurrencyId,
		BigDecimal totalAmount,
		BigDecimal debitTotal,
		BigDecimal creditTotal,
		List<ErpGlVoucherEntryRequest> entries,
		List<ErpLookupItemFinanceAccountDto> financeAccounts) {
}
