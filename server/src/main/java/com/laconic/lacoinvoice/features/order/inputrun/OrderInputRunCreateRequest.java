package com.laconic.lacoinvoice.features.order.inputrun;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(name = "LacoinvoiceOrderInputRunCreateRequest")
public class OrderInputRunCreateRequest {

	@NotBlank
	@Size(max = 200)
	private String title;

	@NotNull
	private Long storeId;

	@NotBlank
	private String marketplaceCode;

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public Long getStoreId() {
		return storeId;
	}

	public void setStoreId(Long storeId) {
		this.storeId = storeId;
	}

	public String getMarketplaceCode() {
		return marketplaceCode;
	}

	public void setMarketplaceCode(String marketplaceCode) {
		this.marketplaceCode = marketplaceCode;
	}
}
