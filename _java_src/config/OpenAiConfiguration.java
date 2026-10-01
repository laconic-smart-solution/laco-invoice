package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties({ OpenAiProperties.class, OrderInputAiProperties.class })
public class OpenAiConfiguration {

	@Bean
	RestClient openAiRestClient(OpenAiProperties properties) {
		return RestClient.builder()
				.baseUrl(properties.getBaseUrl())
				.build();
	}
}
