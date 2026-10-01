package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends MasterEntity {

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(name = "auth_server_user_id", length = 255)
	private String authServerUserId;

	@Column(name = "full_name", length = 255)
	private String fullName;

	@Column(name = "role", nullable = false)
	private UserRole role;

	@Column(nullable = false)
	private boolean active = true;
}
