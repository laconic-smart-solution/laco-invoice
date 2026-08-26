package com.laconic.lacoinvoice.features.store.tiktok;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "LacoinvoiceTikTokScrapeConnectRequest")
public class TikTokScrapeConnectRequest {

	@NotBlank
	private String sellerId;

	private String displayName;

	/** Playwright storage_state JSON (optional if already saved in scrape service DB). */
	private String scrapeSessionJson;

	public String getSellerId() {
		return sellerId;
	}

	public void setSellerId(String sellerId) {
		this.sellerId = sellerId;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getScrapeSessionJson() {
		return scrapeSessionJson;
	}

	public void setScrapeSessionJson(String scrapeSessionJson) {
		this.scrapeSessionJson = scrapeSessionJson;
	}
}
