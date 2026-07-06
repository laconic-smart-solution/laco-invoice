package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.communication")
public class CommunicationProperties {

	private String gatewayUrl = "http://localhost:8084";
	private String lazadaBasePath = "";
	private String shopeeBasePath = "";
	private String tiktokBasePath = "";
	private String gatewaySecret = "hello";

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
}
