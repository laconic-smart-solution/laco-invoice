package com.laconic.lacoinvoice.features.order;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
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
		return new OrderDto(
				entity.getId(),
				storeId,
				storeName,
				marketplaceId,
				marketplaceCode,
				customerId,
				customerName,
				entity.getExternalOrderId(),
				entity.getOrderStatus(),
				entity.getSubtotal(),
				entity.getShippingFee(),
				entity.getTotalAmount(),
				entity.getCurrency(),
				entity.getOrderDate(),
				entity.getCreatedAt());
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
