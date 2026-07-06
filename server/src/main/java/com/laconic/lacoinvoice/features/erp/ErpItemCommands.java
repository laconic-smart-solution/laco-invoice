package com.laconic.lacoinvoice.features.erp;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

public final class ErpItemCommands {

	private ErpItemCommands() {
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceErpItemCreateRequest")
	public static class CreateRequest {

		@NotBlank
		private String erpCode;

		@NotBlank
		private String name;

		private String description;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceErpItemUpdateRequest")
	public static class UpdateRequest {

		@NotBlank
		private String erpCode;

		@NotBlank
		private String name;

		private String description;
	}
}
