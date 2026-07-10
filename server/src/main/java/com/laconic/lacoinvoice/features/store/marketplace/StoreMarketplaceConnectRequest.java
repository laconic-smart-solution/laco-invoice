package com.laconic.lacoinvoice.features.store.marketplace;

import jakarta.validation.constraints.NotBlank;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "StoreMarketplaceConnectRequest")
public class StoreMarketplaceConnectRequest {

	@NotBlank
	private String code;

	private String displayName;

	private String shopId;

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getShopId() {
		return shopId;
	}

	public void setShopId(String shopId) {
		this.shopId = shopId;
	}
}
