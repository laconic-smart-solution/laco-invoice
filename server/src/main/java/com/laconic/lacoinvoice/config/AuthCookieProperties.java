package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.cookies")
public class AuthCookieProperties {

	private String accessName = "laco_invoice_access_token";

	private String refreshName = "laco_invoice_refresh_token";

	private boolean secure = true;

	private String sameSite = "Lax";

	private String path = "/";

	private String refreshPath = "/api/v1/auth";

	public String getAccessName() {
		return accessName;
	}

	public void setAccessName(String accessName) {
		this.accessName = accessName;
	}

	public String getRefreshName() {
		return refreshName;
	}

	public void setRefreshName(String refreshName) {
		this.refreshName = refreshName;
	}

	public boolean isSecure() {
		return secure;
	}

	public void setSecure(boolean secure) {
		this.secure = secure;
	}

	public String getSameSite() {
		return sameSite;
	}

	public void setSameSite(String sameSite) {
		this.sameSite = sameSite;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}

	public String getRefreshPath() {
		return refreshPath;
	}

	public void setRefreshPath(String refreshPath) {
		this.refreshPath = refreshPath;
	}
}
