package com.laconic.lacoinvoice.integration.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayOrderItemData(
		@JsonProperty("external_order_id") String externalOrderId,
		String status,
		@JsonProperty("total_amount") String totalAmount,
		String currency,
		@JsonProperty("ordered_at") String orderedAt) {
}
