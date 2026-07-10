package com.laconic.lacoinvoice.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthChangePasswordRequest {

	@NotBlank
	private String newPassword;
}
