package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductSyncRunDto;

final class MarketplaceProductSyncProgressJson {

	private static final ObjectMapper MAPPER = new ObjectMapper()
			.registerModule(new JavaTimeModule())
			.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

	private MarketplaceProductSyncProgressJson() {
	}

	static String toJson(MarketplaceProductSyncRunDto dto) throws com.fasterxml.jackson.core.JsonProcessingException {
		return MAPPER.writeValueAsString(dto);
	}

	static MarketplaceProductSyncRunDto fromJson(String json) throws com.fasterxml.jackson.core.JsonProcessingException {
		return MAPPER.readValue(json, MarketplaceProductSyncRunDto.class);
	}
}
