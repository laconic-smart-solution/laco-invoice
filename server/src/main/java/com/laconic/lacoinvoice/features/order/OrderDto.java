package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.OrderSourceType;
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
		String customerPhone,
		String externalOrderId,
		OrderStatus orderStatus,
		OrderSourceType sourceType,
		BigDecimal subtotal,
		BigDecimal shippingFee,
		BigDecimal amountExVat,
		BigDecimal vatAmount,
		BigDecimal totalAmount,
		BigDecimal totalFees,
		BigDecimal totalAdjustments,
		String currency,
		Instant orderDate,
		Instant createdAt) {
}
