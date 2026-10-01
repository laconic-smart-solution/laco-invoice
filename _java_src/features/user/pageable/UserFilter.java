package com.laconic.lacoinvoice.features.user.pageable;

import com.laconic.lacoinvoice.domain.models.UserRole;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceUserFilter")
public class UserFilter {

	private UserRole role;

	private String email;

	private String fullName;

	private String authServerUserId;

	private Boolean active;
}
