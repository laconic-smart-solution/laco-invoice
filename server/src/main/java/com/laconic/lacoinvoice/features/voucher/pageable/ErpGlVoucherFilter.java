package com.laconic.lacoinvoice.features.voucher.pageable;

import com.laconic.lacoinvoice.domain.models.ErpGlVoucherCategory;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceErpGlVoucherFilter")
public class ErpGlVoucherFilter {

	private Long storeId;

	private String voucherNumber;

	private ErpGlVoucherCategory voucherCategory;

	private ErpGlVoucherStatus status;
}
