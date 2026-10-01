package com.laconic.lacoinvoice.features.voucher.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceErpGlVoucherInvoicePreviewRequest")
public class ErpGlVoucherInvoicePreviewRequest {

	@NotNull
	private Long invoiceId;

	private Long externalErpItemId;

	private Long tradingPartnerTypeId;

	private Long debitAccountId;

	private Long creditAccountId;

	private String accountType;

	private Long externalErpVendorId;

	private Long externalErpDepartmentId;

	private Long externalErpCurrencyId;

	private Boolean noTaxInvoice;
}
