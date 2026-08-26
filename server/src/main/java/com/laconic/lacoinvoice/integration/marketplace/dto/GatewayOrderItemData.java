package com.laconic.lacoinvoice.integration.marketplace.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayOrderItemData(
		@JsonProperty("external_order_id") String externalOrderId,
		String status,
		@JsonProperty("total_amount") String totalAmount,
		String currency,
		@JsonProperty("ordered_at") String orderedAt,
		@JsonProperty("customer_name") String customerName,
		@JsonProperty("customer_email") String customerEmail,
		@JsonProperty("customer_phone") String customerPhone,
		@JsonProperty("customer_address") String customerAddress,
		@JsonProperty("external_customer_id") String externalCustomerId,
		List<GatewayOrderLineItemData> items) {
}
