package com.laconic.lacoinvoice.features.auth;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import com.laconic.lacoinvoice.config.AuthCookieProperties;

@Configuration
@EnableConfigurationProperties(AuthCookieProperties.class)
public class AuthConfiguration {
}
