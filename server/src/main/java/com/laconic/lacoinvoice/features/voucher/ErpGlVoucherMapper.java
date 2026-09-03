package com.laconic.lacoinvoice.features.voucher;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherEntry;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherEntryDto;

@Component
public class ErpGlVoucherMapper implements BaseMapper<ErpGlVoucher, ErpGlVoucherDto> {

	@Override
	public ErpGlVoucherDto toDto(ErpGlVoucher entity) {
		if (entity == null) {
			return null;
		}
		List<ErpGlVoucherEntry> entries = entity.getEntries() == null ? List.of() : entity.getEntries();
		BigDecimal debitTotal = entries.stream()
				.map(entry -> nonNull(entry.getDebit()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal creditTotal = entries.stream()
				.map(entry -> nonNull(entry.getCredit()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		return new ErpGlVoucherDto(
				entity.getId(),
				entity.getVoucherNumber(),
				entity.getVoucherRefNo(),
				entity.getErpVoucherNo(),
				entity.getVoucherCategory(),
				entity.getVoucherDate(),
				entity.getTaxMonth(),
				entity.getWhtMonth(),
				entity.getCurrency(),
				entity.getChequeTransferNumber(),
				entity.getVoucherBrief(),
				entity.getVoucherDescription(),
				Boolean.TRUE.equals(entity.getNoTaxInvoice()),
				entity.getRejectRemark(),
				entity.getStatus(),
				entity.getStore() != null ? entity.getStore().getId() : null,
				entity.getStore() != null ? entity.getStore().getName() : null,
				entity.getInvoice() != null ? entity.getInvoice().getId() : null,
				entity.getInvoice() != null ? entity.getInvoice().getInvoiceNumber() : null,
				entity.getExternalErpItemId(),
				entity.getExternalErpAccountCodeId(),
				entity.getExternalErpVendorId(),
				debitTotal,
				creditTotal,
				entity.getGenerateError(),
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}

	public ErpGlVoucherEntryDto toEntryDto(ErpGlVoucherEntry entity) {
		if (entity == null) {
			return null;
		}
		return new ErpGlVoucherEntryDto(
				entity.getId(),
				entity.getExternalErpAccountCodeId(),
				nonNull(entity.getDebit()),
				nonNull(entity.getCredit()),
				entity.getInvoiceNo(),
				entity.getInvoiceDate(),
				entity.getNote(),
				entity.getExternalErpVendorId(),
				entity.getExternalErpDepartmentId(),
				entity.getExternalErpCurrencyId(),
				entity.getExchangeRate());
	}

	private static BigDecimal nonNull(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}
}
