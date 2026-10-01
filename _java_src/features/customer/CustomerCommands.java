package com.laconic.lacoinvoice.features.customer;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

public final class CustomerCommands {

	private CustomerCommands() {
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceCustomerCreateRequest")
	public static class CreateRequest {

		@NotBlank
		private String name;

		@Email
		private String email;

		private String phone;

		private String gender;

		private String address;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceCustomerUpdateRequest")
	public static class UpdateRequest {

		@NotBlank
		private String name;

		@Email
		private String email;

		private String phone;

		private String gender;

		private String address;
	}
}
