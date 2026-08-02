package com.laconic.lacoinvoice.features.invoice.bulk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

final class OrderBulkGenerateProgressJson {

	private static final ObjectMapper MAPPER = new ObjectMapper()
			.registerModule(new JavaTimeModule())
			.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

	private OrderBulkGenerateProgressJson() {
	}

	static String toJson(OrderBulkGenerateRunDto dto) throws com.fasterxml.jackson.core.JsonProcessingException {
		return MAPPER.writeValueAsString(dto);
	}

	static OrderBulkGenerateRunDto fromJson(String json) throws com.fasterxml.jackson.core.JsonProcessingException {
		return MAPPER.readValue(json, OrderBulkGenerateRunDto.class);
	}
}
