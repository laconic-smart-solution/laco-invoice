package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.PersistableEnum;

public enum UserRole implements PersistableEnum {
	OWNER(1),
	MANAGER(2),
	STAFF(3),
	ADMIN(4);

	private final int code;

	UserRole(int code) {
		this.code = code;
	}

	@Override
	public int getCode() {
		return code;
	}
}
