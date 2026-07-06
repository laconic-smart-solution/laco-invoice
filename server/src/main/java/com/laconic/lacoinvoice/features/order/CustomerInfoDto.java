package com.laconic.lacoinvoice.features.order;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceCustomerInfoDto")
public record CustomerInfoDto(
		Long id,
		String name,
		String email,
		String phone,
		String gender,
		String address) {
}
