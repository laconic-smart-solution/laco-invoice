package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(LacoinvoiceCorsProperties.class)
public class LacoinvoiceCorsConfiguration implements WebMvcConfigurer {

	private final LacoinvoiceCorsProperties corsProperties;

	public LacoinvoiceCorsConfiguration(LacoinvoiceCorsProperties corsProperties) {
		this.corsProperties = corsProperties;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		if (!corsProperties.isEnabled()) {
			return;
		}
		String[] origins = corsProperties.allowedOriginPatternArray();
		if (origins.length == 0) {
			return;
		}
		var registration = registry.addMapping("/**")
				.allowedOriginPatterns(origins)
				.allowedMethods(corsProperties.allowedMethodArray())
				.allowedHeaders("*");
		if (corsProperties.isAllowCredentials()) {
			registration.allowCredentials(true);
		}
		String[] exposed = corsProperties.exposedHeaderArray();
		if (exposed.length > 0) {
			registration.exposedHeaders(exposed);
		}
	}
}
