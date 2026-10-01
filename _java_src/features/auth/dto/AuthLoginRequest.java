package com.laconic.lacoinvoice.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthLoginRequest {

	@NotBlank
	private String identifier;

	@NotBlank
	private String password;

	private boolean rememberMe;
}
