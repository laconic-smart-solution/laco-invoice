package com.laconic.lacoinvoice.features.voucher.dto;

import java.util.List;

public record ErpGlVoucherDetailDto(
		ErpGlVoucherDto voucher,
		List<ErpGlVoucherEntryDto> entries) {
}
