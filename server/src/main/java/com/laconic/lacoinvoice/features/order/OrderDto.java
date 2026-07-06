package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.OrderStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderDto")
public record OrderDto(
		Long id,
		Long storeId,
		Long marketplaceId,
		String marketplaceCode,
		Long customerId,
		String externalOrderId,
		OrderStatus orderStatus,
		BigDecimal subtotal,
		BigDecimal shippingFee,
		BigDecimal totalAmount,
		Instant orderDate,
		Instant createdAt) {
}
