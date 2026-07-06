package com.laconic.lacoinvoice.integration.marketplace.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayOrderListData(List<GatewayOrderItemData> items) {
}
