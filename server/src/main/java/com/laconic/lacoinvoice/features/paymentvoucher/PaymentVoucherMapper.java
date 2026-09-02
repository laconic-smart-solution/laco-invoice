package com.laconic.lacoinvoice.features.paymentvoucher;

import java.util.List;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.PaymentVoucher;
import com.laconic.lacoinvoice.domain.models.VoucherOrderAllocation;
import com.laconic.lacoinvoice.domain.repositories.VoucherOrderAllocationRepository;
import com.laconic.lacoinvoice.features.paymentvoucher.dto.PaymentVoucherDto;
import com.laconic.lacoinvoice.features.paymentvoucher.dto.VoucherAllocationDto;

@Component
public class PaymentVoucherMapper implements BaseMapper<PaymentVoucher, PaymentVoucherDto> {

	private final VoucherOrderAllocationRepository allocationRepository;

	public PaymentVoucherMapper(VoucherOrderAllocationRepository allocationRepository) {
		this.allocationRepository = allocationRepository;
	}

	@Override
	public PaymentVoucherDto toDto(PaymentVoucher entity) {
		if (entity == null) {
			return null;
		}
		List<VoucherAllocationDto> allocations =
				allocationRepository.findByVoucher_IdOrderByIdAsc(entity.getId()).stream()
						.map(PaymentVoucherMapper::toAllocationDto)
						.toList();
		return new PaymentVoucherDto(
				entity.getId(),
				entity.getVoucherNumber(),
				entity.getVoucherDate(),
				entity.getStore() != null ? entity.getStore().getId() : null,
				entity.getStore() != null ? entity.getStore().getName() : null,
				entity.getCustomerName(),
				entity.getCustomerTaxId(),
				entity.getTotalAmount(),
				entity.getAllocatedAmount(),
				entity.getUnallocatedAmount(),
				entity.getPaymentMethod(),
				entity.getBankReference(),
				entity.getProofFileUrl(),
				entity.getNotes(),
				entity.getStatus(),
				entity.getCreatedAt(),
				entity.getUpdatedAt(),
				allocations);
	}

	public static VoucherAllocationDto toAllocationDto(VoucherOrderAllocation entity) {
		if (entity == null) {
			return null;
		}
		return new VoucherAllocationDto(
				entity.getId(),
				entity.getVoucher() != null ? entity.getVoucher().getId() : null,
				entity.getOrder() != null ? entity.getOrder().getId() : null,
				entity.getExternalOrderId(),
				entity.getInvoice() != null ? entity.getInvoice().getId() : null,
				entity.getInvoiceNumber(),
				entity.getOrderTotalAmount(),
				entity.getAllocatedAmount(),
				entity.getPreviousPaidAmount(),
				entity.getRemainingBalance(),
				entity.getBuyerName(),
				entity.getAllocatedAt(),
				entity.getNotes());
	}
}
