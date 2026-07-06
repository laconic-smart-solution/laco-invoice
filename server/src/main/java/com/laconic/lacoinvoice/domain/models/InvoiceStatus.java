package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.PersistableEnum;

public enum InvoiceStatus implements PersistableEnum {
	ISSUED(1),
	VOID(2);

	private final int code;

	InvoiceStatus(int code) {
		this.code = code;
	}

	@Override
	public int getCode() {
		return code;
	}
}
