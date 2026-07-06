package com.laconic.lacoinvoice.integration.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayApiResponse<T>(
		boolean success,
		String message,
		T data,
		String error) {
}
