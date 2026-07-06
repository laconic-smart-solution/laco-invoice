package com.laconic.lacoinvoice.features.invoice;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.Invoice;

@Component
public class InvoiceMapper implements BaseMapper<Invoice, InvoiceDto> {

	@Override
	public InvoiceDto toDto(Invoice entity) {
		if (entity == null) {
			return null;
		}
		Long orderId = entity.getOrder() != null ? entity.getOrder().getId() : null;
		return new InvoiceDto(
				entity.getId(),
				orderId,
				entity.getInvoiceNo(),
				entity.getSubtotal(),
				entity.getVatAmount(),
				entity.getVatPercentage(),
				entity.getGrandTotal(),
				entity.getStatus(),
				entity.getPdfUrl(),
				entity.getIssuedAt(),
				entity.getCreatedAt());
	}

	public InvoiceListItemDto toListItemDto(Invoice entity) {
		if (entity == null) {
			return null;
		}
		Long orderId = entity.getOrder() != null ? entity.getOrder().getId() : null;
		return new InvoiceListItemDto(
				entity.getId(),
				orderId,
				entity.getInvoiceNo(),
				entity.getGrandTotal(),
				entity.getStatus(),
				entity.getIssuedAt());
	}
}
