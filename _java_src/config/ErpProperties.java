package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.erp")
public class ErpProperties {

	/**
	 * When true, lookups and voucher post call the live ERP API.
	 * When false, the in-memory mock catalog is used and post only flips local status.
	 */
	private boolean enabled = false;

	private String baseUrl = "";

	private String token = "";

	private String postedBy = "LACO-INVOICE";

	private boolean insecureSsl = false;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getBaseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public String getPostedBy() {
		return postedBy;
	}

	public void setPostedBy(String postedBy) {
		this.postedBy = postedBy;
	}

	public boolean isInsecureSsl() {
		return insecureSsl;
	}

	public void setInsecureSsl(boolean insecureSsl) {
		this.insecureSsl = insecureSsl;
	}

	public boolean hasBaseUrl() {
		return StringUtils.hasText(baseUrl);
	}

	public boolean hasToken() {
		return StringUtils.hasText(token);
	}
}
