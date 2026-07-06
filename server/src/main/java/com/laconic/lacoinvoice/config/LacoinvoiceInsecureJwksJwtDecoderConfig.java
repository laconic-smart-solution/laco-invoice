package com.laconic.lacoinvoice.config;

import java.security.GeneralSecurityException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.web.client.RestTemplate;

@Configuration
@ConditionalOnProperty(name = "app.security.jwks.insecure-ssl", havingValue = "true")
public class LacoinvoiceInsecureJwksJwtDecoderConfig {

	private static final Logger log = LoggerFactory.getLogger(LacoinvoiceInsecureJwksJwtDecoderConfig.class);

	@Bean
	JwtDecoder jwtDecoder(
			@Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri)
			throws GeneralSecurityException {
		String uri = jwkSetUri.trim();
		if (uri.isEmpty()) {
			throw new IllegalStateException(
					"spring.security.oauth2.resourceserver.jwt.jwk-set-uri is required when JWT is enabled");
		}
		log.warn(
				"JWT JWKS fetch uses INSECURE SSL (certificate and hostname verification disabled). "
						+ "Set app.security.jwks.insecure-ssl=false in production. JWKS URI: {}",
				uri);
		RestTemplate restTemplate = new RestTemplate(InsecureSslHttpClientSupport.insecureRequestFactory());
		return NimbusJwtDecoder.withJwkSetUri(uri).restOperations(restTemplate).build();
	}
}
