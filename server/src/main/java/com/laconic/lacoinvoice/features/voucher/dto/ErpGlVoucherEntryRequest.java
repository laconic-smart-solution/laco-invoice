package com.laconic.lacoinvoice.features.voucher.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceErpGlVoucherEntryRequest")
public class ErpGlVoucherEntryRequest {

	@NotNull
	private Long externalErpAccountCodeId;

	private BigDecimal debit;

	private BigDecimal credit;

	@Size(max = 100)
	private String invoiceNo;

	private LocalDate invoiceDate;

	@Size(max = 500)
	private String note;

	private Long externalErpVendorId;

	private Long externalErpDepartmentId;

	private Long externalErpCurrencyId;

	private BigDecimal exchangeRate;
}
