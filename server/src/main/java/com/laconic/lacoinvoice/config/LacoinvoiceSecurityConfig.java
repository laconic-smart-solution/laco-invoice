package com.laconic.lacoinvoice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class LacoinvoiceSecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			@Value("${app.security.mode:oauth2}") String securityMode,
			AuditUserContextFilter auditUserContextFilter,
			CookieBearerTokenResolver cookieBearerTokenResolver) throws Exception {
		http.csrf(AbstractHttpConfigurer::disable);
		http.cors(Customizer.withDefaults());
		if ("permit_all".equalsIgnoreCase(securityMode.trim())) {
			http.authorizeHttpRequests(auth -> auth
					.requestMatchers(HttpMethod.OPTIONS, "/**")
					.permitAll()
					.requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
					.permitAll()
					.requestMatchers(HttpMethod.POST, "/api/v1/users")
					.permitAll()
				.requestMatchers(HttpMethod.POST,
						"/api/v1/auth/login",
						"/api/v1/auth/verify-otp",
						"/api/v1/auth/resend-otp",
						"/api/v1/auth/refresh",
						"/api/v1/auth/logout")
					.permitAll()
					.anyRequest()
					.permitAll());
			return http.build();
		}
		http.oauth2ResourceServer(oauth2 -> oauth2
				.bearerTokenResolver(cookieBearerTokenResolver)
				.jwt(Customizer.withDefaults()));
		http.addFilterAfter(auditUserContextFilter, BearerTokenAuthenticationFilter.class);
		http.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**")
				.permitAll()
				.requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
				.permitAll()
				.requestMatchers(HttpMethod.POST, "/api/v1/users")
				.permitAll()
				.requestMatchers(HttpMethod.POST,
						"/api/v1/auth/login",
						"/api/v1/auth/verify-otp",
						"/api/v1/auth/resend-otp",
						"/api/v1/auth/refresh",
						"/api/v1/auth/logout")
					.permitAll()
				.requestMatchers("/api/v1/internal/tiktok-seller-sessions", "/api/v1/internal/tiktok-seller-sessions/**")
					.permitAll()
				.anyRequest()
				.authenticated());
		return http.build();
	}
}
