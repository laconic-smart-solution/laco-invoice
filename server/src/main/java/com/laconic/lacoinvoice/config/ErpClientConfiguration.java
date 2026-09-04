package com.laconic.lacoinvoice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(ErpProperties.class)
public class ErpClientConfiguration {

	private static final Logger log = LoggerFactory.getLogger(ErpClientConfiguration.class);

	@Bean
	@Qualifier("erpRestClient")
	@ConditionalOnProperty(name = "app.erp.enabled", havingValue = "true")
	RestClient erpRestClient(ErpProperties properties) throws Exception {
		if (!properties.hasBaseUrl()) {
			throw new IllegalStateException(
					"app.erp.enabled=true requires ERP_API_BASE_URL / app.erp.base-url");
		}
		RestClient.Builder builder = RestClient.builder()
				.baseUrl(trimTrailingSlash(properties.getBaseUrl()))
				.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
		if (properties.hasToken()) {
			builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getToken().trim());
		}
		if (properties.isInsecureSsl()) {
			log.warn(
					"ERP HTTP client uses INSECURE SSL. Set app.erp.insecure-ssl=false in production.");
			builder.requestFactory(InsecureSslHttpClientSupport.insecureJdkRequestFactory());
		}
		return builder.build();
	}

	private static String trimTrailingSlash(String baseUrl) {
		String value = baseUrl.trim();
		if (value.endsWith("/")) {
			return value.substring(0, value.length() - 1);
		}
		return value;
	}
}
