package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sso")
public class SsoProperties {

	private String url = "";

	private final Signup signup = new Signup();

	private String applicationCode = "";

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public Signup getSignup() {
		return signup;
	}

	public String getApplicationCode() {
		return applicationCode;
	}

	public void setApplicationCode(String applicationCode) {
		this.applicationCode = applicationCode;
	}

	public static class Signup {

		private String url = "";

		public String getUrl() {
			return url;
		}

		public void setUrl(String url) {
			this.url = url;
		}
	}
}
