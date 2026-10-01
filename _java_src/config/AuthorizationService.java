package com.laconic.lacoinvoice.config;

import java.util.Arrays;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.models.UserRole;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;

@Component("authz")
public class AuthorizationService {

	private final UserRepository userRepository;

	public AuthorizationService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	public boolean hasRole(String roleName) {
		if (roleName == null || roleName.isBlank()) {
			return false;
		}
		return currentUserRole()
				.map(role -> role.name().equalsIgnoreCase(roleName.trim()))
				.orElse(false);
	}

	public boolean hasAnyRole(String... roleNames) {
		if (roleNames == null || roleNames.length == 0) {
			return false;
		}
		Optional<UserRole> currentRole = currentUserRole();
		if (currentRole.isEmpty()) {
			return false;
		}
		return Arrays.stream(roleNames)
				.filter(name -> name != null && !name.isBlank())
				.anyMatch(name -> currentRole.get().name().equalsIgnoreCase(name.trim()));
	}

	public boolean isAdmin() {
		return hasRole(UserRole.ADMIN.name());
	}

	public boolean isOwnerOrAdmin() {
		return hasAnyRole(UserRole.OWNER.name(), UserRole.ADMIN.name());
	}

	public boolean isManagerOrAdmin() {
		return hasAnyRole(UserRole.MANAGER.name(), UserRole.ADMIN.name());
	}

	private Optional<UserRole> currentUserRole() {
		return AuditUserContext.getCurrentUserId()
				.flatMap(userRepository::findByAuthServerUserId)
				.map(User::getRole);
	}
}
