package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.openai")
public class OpenAiProperties {

	private boolean enabled = true;
	private String apiKey = "";
	private String model = "gpt-4o-mini";
	private String baseUrl = "https://api.openai.com/v1";

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getApiKey() {
		return apiKey;
	}

	public void setApiKey(String apiKey) {
		this.apiKey = apiKey;
	}

	public String getModel() {
		return model;
	}

	public void setModel(String model) {
		this.model = model;
	}

	public String getBaseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public boolean isConfigured() {
		return enabled && StringUtils.hasText(apiKey);
	}
}
