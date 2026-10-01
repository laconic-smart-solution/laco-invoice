package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.communication")
public class CommunicationProperties {

	private String gatewayUrl = "http://localhost:8084";
	private String lazadaBasePath = "";
	private String shopeeBasePath = "";
	private String tiktokBasePath = "";
	private String gatewaySecret = "hello";
	private String lazadaAppKey = "";
	private String lazadaAppSecret = "";
	private String tiktokAppKey = "";
	private String tiktokAppSecret = "";
	/** When true, TikTok sync calls tiktok-shop-scrape instead of Partner tiktok-service. */
	private boolean tiktokShopScraping = false;
	/** Base URL of tiktok-shop-scrape (e.g. http://localhost:8090). */
	private String tiktokScrapeUrl = "http://localhost:8090";

	public String getGatewayUrl() {
		return gatewayUrl;
	}

	public void setGatewayUrl(String gatewayUrl) {
		this.gatewayUrl = gatewayUrl;
	}

	public String getLazadaBasePath() {
		return lazadaBasePath;
	}

	public void setLazadaBasePath(String lazadaBasePath) {
		this.lazadaBasePath = lazadaBasePath;
	}

	public String getShopeeBasePath() {
		return shopeeBasePath;
	}

	public void setShopeeBasePath(String shopeeBasePath) {
		this.shopeeBasePath = shopeeBasePath;
	}

	public String getTiktokBasePath() {
		return tiktokBasePath;
	}

	public void setTiktokBasePath(String tiktokBasePath) {
		this.tiktokBasePath = tiktokBasePath;
	}

	public String getGatewaySecret() {
		return gatewaySecret;
	}

	public void setGatewaySecret(String gatewaySecret) {
		this.gatewaySecret = gatewaySecret;
	}

	public String getLazadaAppKey() {
		return lazadaAppKey;
	}

	public void setLazadaAppKey(String lazadaAppKey) {
		this.lazadaAppKey = lazadaAppKey;
	}

	public String getLazadaAppSecret() {
		return lazadaAppSecret;
	}

	public void setLazadaAppSecret(String lazadaAppSecret) {
		this.lazadaAppSecret = lazadaAppSecret;
	}

	public String getTiktokAppKey() {
		return tiktokAppKey;
	}

	public void setTiktokAppKey(String tiktokAppKey) {
		this.tiktokAppKey = tiktokAppKey;
	}

	public String getTiktokAppSecret() {
		return tiktokAppSecret;
	}

	public void setTiktokAppSecret(String tiktokAppSecret) {
		this.tiktokAppSecret = tiktokAppSecret;
	}

	public boolean isTiktokShopScraping() {
		return tiktokShopScraping;
	}

	public void setTiktokShopScraping(boolean tiktokShopScraping) {
		this.tiktokShopScraping = tiktokShopScraping;
	}

	public String getTiktokScrapeUrl() {
		return tiktokScrapeUrl;
	}

	public void setTiktokScrapeUrl(String tiktokScrapeUrl) {
		this.tiktokScrapeUrl = tiktokScrapeUrl;
	}
}
