package com.laconic.lacoinvoice.integration.lazada.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LazadaApiResponse<T>(
		boolean success,
		String message,
		T data,
		String error) {
}
