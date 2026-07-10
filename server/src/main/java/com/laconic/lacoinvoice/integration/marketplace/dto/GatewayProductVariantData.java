package com.laconic.lacoinvoice.integration.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayProductVariantData(
		String sku,
		String price,
		String currency,
		String status,
		String quantity) {
}
