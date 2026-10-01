package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.order-input.ai-auto-choose")
public class OrderInputAiProperties {

	/**
	 * When true, ensures the default admin account has AI auto-choose enabled on startup.
	 */
	private boolean defaultAdminEnabled = false;

	public boolean isDefaultAdminEnabled() {
		return defaultAdminEnabled;
	}

	public void setDefaultAdminEnabled(boolean defaultAdminEnabled) {
		this.defaultAdminEnabled = defaultAdminEnabled;
	}
}
