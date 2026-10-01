package com.laconic.lacoinvoice.features.customer;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceCustomerDto")
public record CustomerDto(
		Long id,
		Long storeId,
		String storeName,
		Long marketplaceId,
		String marketplaceCode,
		String externalCustomerId,
		String name,
		String email,
		String phone,
		String gender,
		String address,
		Instant createdAt,
		Instant updatedAt) {
}
