package com.laconic.lacoinvoice.features.voucher.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.ErpGlVoucherCategory;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceErpGlVoucherGenerateRequest")
public class ErpGlVoucherGenerateRequest {

	private Long storeId;

	private Long invoiceId;

	@NotNull
	private ErpGlVoucherCategory voucherCategory;

	@NotNull
	private LocalDate voucherDate;

	private LocalDate taxMonth;

	private LocalDate whtMonth;

	@Size(max = 3)
	private String currency;

	@Size(max = 100)
	private String chequeTransferNumber;

	@NotBlank
	@Size(max = 500)
	private String voucherBrief;

	private String voucherDescription;

	private Boolean noTaxInvoice;

	@Size(max = 1000)
	private String rejectRemark;

	@NotNull
	private Long externalErpItemId;

	@NotNull
	private Long externalErpAccountCodeId;

	@NotNull
	private Long externalErpVendorId;

	@Valid
	@NotEmpty
	private List<ErpGlVoucherEntryRequest> entries = new ArrayList<>();
}
