package com.laconic.lacoinvoice.features.me.dto;

import org.springframework.util.StringUtils;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeCredentialsRequest {

	@NotBlank(message = "Current password is required.")
	private String currentPassword;

	@Email(message = "Enter a valid email address.")
	private String newEmail;

	@Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters.")
	private String newUsername;

	@AssertTrue(message = "Provide a new email or a new username.")
	public boolean isAtLeastOneChangeProvided() {
		return StringUtils.hasText(newEmail) || StringUtils.hasText(newUsername);
	}
}
