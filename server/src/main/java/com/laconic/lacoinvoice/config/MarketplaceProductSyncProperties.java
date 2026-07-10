package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.marketplace-product-sync")
public class MarketplaceProductSyncProperties {

	private int listChunkSize = 50;
	private int detailChunkSize = 10;
	private long detailRequestDelayMs = 300;

	public int getListChunkSize() {
		return listChunkSize;
	}

	public void setListChunkSize(int listChunkSize) {
		this.listChunkSize = listChunkSize;
	}

	public int getDetailChunkSize() {
		return detailChunkSize;
	}

	public void setDetailChunkSize(int detailChunkSize) {
		this.detailChunkSize = detailChunkSize;
	}

	public long getDetailRequestDelayMs() {
		return detailRequestDelayMs;
	}

	public void setDetailRequestDelayMs(long detailRequestDelayMs) {
		this.detailRequestDelayMs = detailRequestDelayMs;
	}
}
