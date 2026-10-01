package com.laconic.lacoinvoice.integration.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayProductItemData(
		@JsonProperty("external_product_id") String externalProductId,
		String sku,
		String name,
		String price,
		String currency,
		String status) {
}
