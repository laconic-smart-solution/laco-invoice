package com.laconic.lacoinvoice.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(CommunicationProperties.class)
public class MarketplaceClientConfiguration {

	@Bean
	@Qualifier("marketplaceRestClient")
	public RestClient marketplaceRestClient() {
		return RestClient.builder()
				.requestFactory(InsecureSslHttpClientSupport.jdkRequestFactory())
				.build();
	}

	@Bean
	@Qualifier("lazadaRestClient")
	public RestClient lazadaRestClient(@Qualifier("marketplaceRestClient") RestClient restClient) {
		return restClient;
	}
}
