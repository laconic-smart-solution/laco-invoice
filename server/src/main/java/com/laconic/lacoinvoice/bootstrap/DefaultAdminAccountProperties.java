package com.laconic.lacoinvoice.bootstrap;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import com.laconic.lacoinvoice.domain.models.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Validated
@ConfigurationProperties(prefix = "app.users.default-admin")
public class DefaultAdminAccountProperties {

	private boolean enabled;

	@NotBlank
	@Email
	private String email = "admin@gmail.com";

	private String fullName = "Admin Laconic";

	private String username = "admin";

	private String authServerUserId;

	private UserRole role = UserRole.ADMIN;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getAuthServerUserId() {
		return authServerUserId;
	}

	public void setAuthServerUserId(String authServerUserId) {
		this.authServerUserId = authServerUserId;
	}

	public UserRole getRole() {
		return role;
	}

	public void setRole(UserRole role) {
		this.role = role;
	}
}
