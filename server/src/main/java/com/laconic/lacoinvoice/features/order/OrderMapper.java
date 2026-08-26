package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.models.OrderSourceType;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderItem;

@Component
public class OrderMapper implements BaseMapper<Order, OrderDto> {

	@Override
	public OrderDto toDto(Order entity) {
		if (entity == null) {
			return null;
		}
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		String storeName = entity.getStore() != null ? entity.getStore().getName() : null;
		Long marketplaceId = entity.getMarketplace() != null ? entity.getMarketplace().getId() : null;
		String marketplaceCode = entity.getMarketplace() != null ? entity.getMarketplace().getCode() : null;
		Long customerId = entity.getCustomer() != null ? entity.getCustomer().getId() : null;
		String customerName = entity.getCustomer() != null ? entity.getCustomer().getName() : null;
		String customerPhone = entity.getCustomer() != null ? entity.getCustomer().getPhone() : null;
		OrderMoneyCalculator.VatBreakdown vat = resolveVat(entity);
		return new OrderDto(
				entity.getId(),
				storeId,
				storeName,
				marketplaceId,
				marketplaceCode,
				customerId,
				customerName,
				customerPhone,
				entity.getExternalOrderId(),
				entity.getOrderStatus(),
				entity.getSourceType() != null ? entity.getSourceType() : OrderSourceType.API,
				entity.getSubtotal(),
				entity.getShippingFee(),
				vat.amountExVat(),
				vat.vatAmount(),
				entity.getTotalAmount(),
				BigDecimal.ZERO,
				BigDecimal.ZERO,
				entity.getCurrency(),
				entity.getOrderDate(),
				entity.getCreatedAt());
	}

	private static OrderMoneyCalculator.VatBreakdown resolveVat(Order entity) {
		if (entity.getAmountExVat() != null && entity.getVatAmount() != null) {
			return new OrderMoneyCalculator.VatBreakdown(entity.getAmountExVat(), entity.getVatAmount());
		}
		return OrderMoneyCalculator.fromInclusiveTotal(entity.getTotalAmount());
	}

	public CustomerInfoDto toCustomerDto(CustomerInfo entity) {
		if (entity == null) {
			return null;
		}
		return new CustomerInfoDto(
				entity.getId(),
				entity.getName(),
				entity.getEmail(),
				entity.getPhone(),
				entity.getGender(),
				entity.getAddress());
	}

	public OrderItemDto toItemDto(OrderItem entity) {
		if (entity == null) {
			return null;
		}
		Long productId = entity.getProduct() != null ? entity.getProduct().getId() : null;
		return new OrderItemDto(
				entity.getId(),
				productId,
				entity.getSku(),
				entity.getProductName(),
				entity.getPrice(),
				entity.getQuantity(),
				entity.getLineTotal());
	}
}
