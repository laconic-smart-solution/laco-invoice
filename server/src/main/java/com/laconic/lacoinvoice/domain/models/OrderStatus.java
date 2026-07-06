package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.PersistableEnum;

public enum OrderStatus implements PersistableEnum {
	PENDING(1),
	CONFIRMED(2),
	SHIPPED(3),
	DELIVERED(4),
	CANCELLED(5);

	private final int code;

	OrderStatus(int code) {
		this.code = code;
	}

	@Override
	public int getCode() {
		return code;
	}

	public static OrderStatus fromCode(int code) {
		for (OrderStatus status : values()) {
			if (status.code == code) {
				return status;
			}
		}
		throw new IllegalArgumentException("Unknown OrderStatus code: " + code);
	}
}
