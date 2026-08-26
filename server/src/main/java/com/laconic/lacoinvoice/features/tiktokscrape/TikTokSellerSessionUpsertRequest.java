package com.laconic.lacoinvoice.features.tiktokscrape;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "LacoinvoiceTikTokSellerSessionUpsertRequest")
public class TikTokSellerSessionUpsertRequest {

	@NotBlank
	private String sellerId;

	@NotBlank
	private String storageStateJson;

	private String displayName;

	public String getSellerId() {
		return sellerId;
	}

	public void setSellerId(String sellerId) {
		this.sellerId = sellerId;
	}

	public String getStorageStateJson() {
		return storageStateJson;
	}

	public void setStorageStateJson(String storageStateJson) {
		this.storageStateJson = storageStateJson;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}
}
