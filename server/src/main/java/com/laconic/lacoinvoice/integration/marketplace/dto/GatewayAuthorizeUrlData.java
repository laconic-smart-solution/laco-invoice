package com.laconic.lacoinvoice.integration.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GatewayAuthorizeUrlData(String url) {
}
