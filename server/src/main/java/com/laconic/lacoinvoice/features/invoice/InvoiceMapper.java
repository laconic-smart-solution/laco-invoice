package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.InvoiceItem;
import com.laconic.lacoinvoice.domain.models.InvoiceOrder;
import com.laconic.lacoinvoice.domain.models.PaymentAllocationStatus;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceItemLineDto;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceOrderSummaryDto;

@Component
public class InvoiceMapper implements BaseMapper<Invoice, InvoiceDto> {

	@Override
	public InvoiceDto toDto(Invoice entity) {
		if (entity == null) {
			return null;
		}
		return new InvoiceDto(
				entity.getId(),
				entity.getInvoiceNumber(),
				entity.getTitle(),
				entity.getStore() != null ? entity.getStore().getId() : null,
				entity.getStore() != null ? entity.getStore().getName() : null,
				entity.getMarketplace() != null ? entity.getMarketplace().getId() : null,
				entity.getMarketplace() != null ? entity.getMarketplace().getCode() : null,
				entity.getStatus(),
				entity.getStartDate(),
				entity.getEndDate(),
				entity.getOrderInputRun() != null ? entity.getOrderInputRun().getId() : null,
				entity.getOrderInputRun() != null ? entity.getOrderInputRun().getTitle() : null,
				entity.getOrderCount(),
				entity.getItemCount(),
				entity.getSubtotal(),
				entity.getVatRate(),
				entity.getVatAmount(),
				entity.getGrandTotal(),
				entity.getCurrency(),
				entity.getNotes(),
				entity.getBuyerName(),
				entity.getBuyerTaxId(),
				entity.getBuyerAddress(),
				entity.getIssuedAt(),
				entity.getPaidAt(),
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}

	public InvoiceOrderSummaryDto toOrderSummaryDto(
			InvoiceOrder entity,
			BigDecimal totalPaidAmount,
			BigDecimal remainingBalance,
			PaymentAllocationStatus paymentStatus) {
		if (entity == null) {
			return null;
		}
		return new InvoiceOrderSummaryDto(
				entity.getOrder() != null ? entity.getOrder().getId() : null,
				entity.getExternalOrderId(),
				entity.getOrderDate(),
				entity.getItemCount(),
				entity.getTotalAmount(),
				entity.getVatAmount(),
				entity.getAmountExVat(),
				entity.getBuyerName(),
				entity.getBuyerTaxId(),
				totalPaidAmount,
				remainingBalance,
				paymentStatus);
	}

	public InvoiceItemLineDto toItemLineDto(InvoiceItem entity) {
		if (entity == null) {
			return null;
		}
		return new InvoiceItemLineDto(
				entity.getId(),
				entity.getOrder() != null ? entity.getOrder().getId() : null,
				entity.getExternalOrderId(),
				entity.getOrderDate(),
				entity.getPlatformSkuId(),
				entity.getSellerSku(),
				entity.getProductName(),
				entity.getVariation(),
				entity.getQuantity(),
				entity.getUnitPrice(),
				entity.getSubtotal(),
				entity.getDiscount(),
				entity.getTotalAmount());
	}
}
