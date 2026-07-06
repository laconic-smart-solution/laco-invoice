package com.laconic.lacoinvoice.features.erp;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceErpItemDto")
public record ErpItemDto(
		Long id,
		String erpCode,
		String name,
		String description,
		Instant createdAt,
		Instant updatedAt) {
}
