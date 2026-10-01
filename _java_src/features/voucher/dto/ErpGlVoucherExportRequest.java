package com.laconic.lacoinvoice.features.voucher.dto;

import java.util.List;

import com.laconic.lacoinvoice.features.voucher.pageable.ErpGlVoucherFilter;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceErpGlVoucherExportRequest")
public class ErpGlVoucherExportRequest {

	/** When non-empty, export only these voucher IDs. */
	private List<Long> ids;

	/** When true (and ids empty or null), export all vouchers matching {@link #filter}. */
	private boolean exportAll;

	private ErpGlVoucherFilter filter;
}
