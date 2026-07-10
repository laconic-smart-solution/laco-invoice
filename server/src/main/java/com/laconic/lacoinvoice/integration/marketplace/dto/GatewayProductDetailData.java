package com.laconic.lacoinvoice.integration.marketplace.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayProductDetailData(
		@JsonProperty("external_product_id") String externalProductId,
		String sku,
		String name,
		String description,
		String price,
		String currency,
		String status,
		List<String> images,
		List<GatewayProductVariantData> variants) {
}
