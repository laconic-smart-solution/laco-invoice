package com.laconic.lacoinvoice.features.invoice;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderItem;

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
		Order order = entity.getOrder();
		Long orderId = order != null ? order.getId() : null;
		String storeName = order != null && order.getStore() != null ? order.getStore().getName() : null;
		String marketplaceCode = order != null && order.getMarketplace() != null
				? order.getMarketplace().getCode()
				: null;
		String customerName = order != null && order.getCustomer() != null ? order.getCustomer().getName() : null;
		String currency = order != null ? order.getCurrency() : null;
		return new InvoiceListItemDto(
				entity.getId(),
				orderId,
				entity.getInvoiceNo(),
				storeName,
				marketplaceCode,
				customerName,
				currency,
				entity.getGrandTotal(),
				entity.getVatPercentage(),
				entity.getStatus(),
				entity.getIssuedAt());
	}

	public InvoiceLineItemDto toLineItemDto(OrderItem item) {
		if (item == null) {
			return null;
		}
		return new InvoiceLineItemDto(
				item.getId(),
				item.getSku(),
				item.getProductName(),
				item.getPrice(),
				item.getQuantity(),
				item.getLineTotal());
	}
}
