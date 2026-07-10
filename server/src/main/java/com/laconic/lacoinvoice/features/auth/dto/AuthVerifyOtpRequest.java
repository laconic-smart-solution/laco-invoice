package com.laconic.lacoinvoice.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthVerifyOtpRequest {

	@NotBlank
	private String email;

	@NotBlank
	private String otp;

	private boolean rememberMe;
}
