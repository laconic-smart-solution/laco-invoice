package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderItemDto")
public record OrderItemDto(
		Long id,
		Long productId,
		String sku,
		String productName,
		BigDecimal price,
		Integer quantity,
		BigDecimal lineTotal) {
}
