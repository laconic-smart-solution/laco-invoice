package com.laconic.lacoinvoice.common.logging;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "lacoinvoice.logging")
public class LoggingProperties {

	private boolean enabled = true;

	private String requestIdHeader = "X-Request-Id";

	private int slowRequestThresholdMs = 1000;

	private List<String> excludePaths = new ArrayList<>(List.of(
			"/actuator",
			"/swagger-ui",
			"/v3/api-docs",
			"/favicon.ico",
			"/error"));
}
