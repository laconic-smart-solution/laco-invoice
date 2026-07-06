package com.laconic.lacoinvoice.common.persistence;

import java.util.Optional;

import com.laconic.lacoinvoice.domain.models.UserRole;

public final class AuditUserContext {

	/** Auth-server user id from JWT claims ({@code userid} / {@code sub}). */
	private static final ThreadLocal<String> CURRENT_USER_ID = new ThreadLocal<>();
	/** Local {@code users.id} when the JWT subject is linked to an app user row. */
	private static final ThreadLocal<Long> CURRENT_LOCAL_USER_ID = new ThreadLocal<>();
	private static final ThreadLocal<UserRole> CURRENT_USER_ROLE = new ThreadLocal<>();

	private AuditUserContext() {
	}

	public static void setCurrentUserId(String authUserId) {
		if (authUserId == null) {
			CURRENT_USER_ID.remove();
			return;
		}
		CURRENT_USER_ID.set(authUserId);
	}

	public static Optional<String> getCurrentUserId() {
		return Optional.ofNullable(CURRENT_USER_ID.get());
	}

	public static void setCurrentLocalUserId(Long userId) {
		if (userId == null) {
			CURRENT_LOCAL_USER_ID.remove();
			return;
		}
		CURRENT_LOCAL_USER_ID.set(userId);
	}

	public static Optional<Long> getCurrentLocalUserId() {
		return Optional.ofNullable(CURRENT_LOCAL_USER_ID.get());
	}

	public static void setCurrentUserRole(UserRole role) {
		if (role == null) {
			CURRENT_USER_ROLE.remove();
			return;
		}
		CURRENT_USER_ROLE.set(role);
	}

	public static boolean isAdmin() {
		return UserRole.ADMIN == CURRENT_USER_ROLE.get();
	}

	public static void clear() {
		CURRENT_USER_ID.remove();
		CURRENT_LOCAL_USER_ID.remove();
		CURRENT_USER_ROLE.remove();
	}
}
