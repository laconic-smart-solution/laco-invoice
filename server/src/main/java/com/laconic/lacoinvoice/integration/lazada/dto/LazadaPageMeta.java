package com.laconic.lacoinvoice.integration.lazada.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LazadaPageMeta(
		int page,
		int limit,
		long total,
		@JsonProperty("total_pages") int totalPages) {
}
