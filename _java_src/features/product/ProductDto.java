package com.laconic.lacoinvoice.features.product;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.ProductErpStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceProductDto")
public record ProductDto(
		Long id,
		Long storeId,
		String sku,
		String name,
		BigDecimal price,
		ProductErpStatus erpStatus,
		Instant createdAt,
		Instant updatedAt) {
}
