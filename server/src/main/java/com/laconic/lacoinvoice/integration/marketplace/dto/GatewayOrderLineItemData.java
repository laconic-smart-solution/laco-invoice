package com.laconic.lacoinvoice.integration.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayOrderLineItemData(
		String sku,
		@JsonProperty("product_name") String productName,
		String price,
		Integer quantity,
		@JsonProperty("line_total") String lineTotal) {
}
