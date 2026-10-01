package com.laconic.lacoinvoice.config;

import java.util.Arrays;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cors")
public class LacoinvoiceCorsProperties {

	private boolean enabled = true;

	private String allowedOriginPatterns = "http://localhost:*,http://127.0.0.1:*";

	private boolean allowCredentials = true;

	private String allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";

	private String exposedHeaders = "Authorization";

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getAllowedOriginPatterns() {
		return allowedOriginPatterns;
	}

	public void setAllowedOriginPatterns(String allowedOriginPatterns) {
		this.allowedOriginPatterns = allowedOriginPatterns;
	}

	public boolean isAllowCredentials() {
		return allowCredentials;
	}

	public void setAllowCredentials(boolean allowCredentials) {
		this.allowCredentials = allowCredentials;
	}

	public String getAllowedMethods() {
		return allowedMethods;
	}

	public void setAllowedMethods(String allowedMethods) {
		this.allowedMethods = allowedMethods;
	}

	public String getExposedHeaders() {
		return exposedHeaders;
	}

	public void setExposedHeaders(String exposedHeaders) {
		this.exposedHeaders = exposedHeaders;
	}

	public String[] allowedOriginPatternArray() {
		return splitCsv(allowedOriginPatterns);
	}

	public String[] allowedMethodArray() {
		return splitCsv(allowedMethods);
	}

	public String[] exposedHeaderArray() {
		String[] parts = splitCsv(exposedHeaders);
		return parts.length == 0 ? new String[0] : parts;
	}

	private static String[] splitCsv(String raw) {
		if (raw == null || raw.isBlank()) {
			return new String[0];
		}
		return Arrays.stream(raw.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.toArray(String[]::new);
	}
}
