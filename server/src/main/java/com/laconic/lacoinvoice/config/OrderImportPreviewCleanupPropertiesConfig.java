package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Registers cleanup properties even when the Quartz job is disabled, so the service
 * can still be invoked manually / from tests with configured retention.
 */
@Configuration
@EnableConfigurationProperties(OrderImportPreviewCleanupQuartzProperties.class)
public class OrderImportPreviewCleanupPropertiesConfig {
}
