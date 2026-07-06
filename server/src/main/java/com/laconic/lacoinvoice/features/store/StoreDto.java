package com.laconic.lacoinvoice.features.store;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceStoreDto")
public record StoreDto(
		Long id,
		Long ownerId,
		String name,
		String logoUrl,
		boolean active,
		Instant createdAt) {
}
