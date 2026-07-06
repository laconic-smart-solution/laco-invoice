package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.PersistableEnum;

public enum PurchaseOrderStatus implements PersistableEnum {
	DRAFT(1),
	SUBMITTED(2),
	APPROVED(3),
	CANCELLED(4);

	private final int code;

	PurchaseOrderStatus(int code) {
		this.code = code;
	}

	@Override
	public int getCode() {
		return code;
	}
}
