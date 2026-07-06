package com.laconic.lacoinvoice.integration.lazada.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LazadaAuthorizeUrlData(String url) {
}
