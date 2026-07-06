package com.laconic.lacoinvoice.bootstrap;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(DefaultAdminAccountProperties.class)
public class UserBootstrapConfiguration {
}
