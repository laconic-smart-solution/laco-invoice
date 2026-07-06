package com.laconic.lacoinvoice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(SsoProperties.class)
public class SsoClientConfiguration {

	private static final Logger log = LoggerFactory.getLogger(SsoClientConfiguration.class);

	@Bean
	@Qualifier("ssoRestClient")
	public RestClient ssoRestClient(
			@Value("${app.sso.insecure-ssl:false}") boolean insecureSsl) throws Exception {
		RestClient.Builder builder = RestClient.builder();
		if (insecureSsl) {
			log.warn(
					"LCN SSO HTTP client uses INSECURE SSL (certificate and hostname verification disabled). "
							+ "Set app.sso.insecure-ssl=false in production.");
			builder.requestFactory(InsecureSslHttpClientSupport.insecureJdkRequestFactory());
		} else {
			builder.requestFactory(InsecureSslHttpClientSupport.jdkRequestFactory());
		}
		return builder.build();
	}
}
