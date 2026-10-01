package com.laconic.lacoinvoice.features.user;

import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.UserRole;
import com.laconic.lacoinvoice.integration.sso.dto.AuthTokenDto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(name = "LacoinvoiceUserDto")
public class UserDto {

	private Long id;

	private Instant createdAt;

	private Instant updatedAt;

	private String email;

	private String authServerUserId;

	private String fullName;

	private UserRole role;

	private boolean active;

	private AuthTokenDto authToken;
}
