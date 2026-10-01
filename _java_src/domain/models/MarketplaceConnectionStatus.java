package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.PersistableEnum;

public enum MarketplaceConnectionStatus implements PersistableEnum {
	CONNECTED(1),
	DISCONNECTED(2),
	EXPIRED(3),
	PENDING(4);

	private final int code;

	MarketplaceConnectionStatus(int code) {
		this.code = code;
	}

	@Override
	public int getCode() {
		return code;
	}
}
