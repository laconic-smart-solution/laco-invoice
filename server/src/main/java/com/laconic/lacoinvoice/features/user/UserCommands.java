package com.laconic.lacoinvoice.features.user;

import com.laconic.lacoinvoice.domain.models.UserRole;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import org.springframework.util.StringUtils;

public final class UserCommands {

	private UserCommands() {
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceUserCreateRequest")
	public static class CreateRequest {

		@NotNull
		private UserRole role;

		@NotBlank
		@Email
		private String email;

		private String username;

		private String password;

		private String fullName;

		private String authServerUserId;

		private Boolean active;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceUserUpdateRequest")
	public static class UpdateRequest {

		@NotNull
		private UserRole role;

		@NotBlank
		@Email
		private String email;

		private String fullName;

		private String authServerUserId;

		private Boolean active;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceUserUpdateRoleRequest")
	public static class UpdateRoleRequest {

		@NotNull
		private UserRole role;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceUserChangeCredentialsRequest")
	public static class ChangeCredentialsRequest {

		@Email(message = "Enter a valid email address.")
		private String newEmail;

		@Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters.")
		private String newUsername;

		@AssertTrue(message = "Provide a new email or a new username.")
		public boolean isAtLeastOneChangeProvided() {
			return StringUtils.hasText(newEmail) || StringUtils.hasText(newUsername);
		}
	}
}
