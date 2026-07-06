package com.laconic.lacoinvoice.features.product;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

public final class ProductCommands {

	private ProductCommands() {
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceProductCreateRequest")
	public static class CreateRequest {

		@NotBlank
		private String sku;

		@NotBlank
		private String name;

		@NotNull
		private BigDecimal price;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceProductUpdateRequest")
	public static class UpdateRequest {

		@NotBlank
		private String sku;

		@NotBlank
		private String name;

		@NotNull
		private BigDecimal price;
	}
}
