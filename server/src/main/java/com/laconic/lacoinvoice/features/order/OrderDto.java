package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.OrderStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderDto")
public record OrderDto(
		Long id,
		Long storeId,
		String storeName,
		Long marketplaceId,
		String marketplaceCode,
		Long customerId,
		String customerName,
		String externalOrderId,
		OrderStatus orderStatus,
		BigDecimal subtotal,
		BigDecimal shippingFee,
		BigDecimal totalAmount,
		String currency,
		Instant orderDate,
		Instant createdAt) {
}
