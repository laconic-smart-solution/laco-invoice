package com.laconic.lacoinvoice.features.invoice.bulk;

import java.util.Collections;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

final class OrderBulkGenerateJsonSupport {

	private static final ObjectMapper MAPPER = new ObjectMapper();
	private static final TypeReference<List<Long>> LONG_LIST = new TypeReference<>() {
	};

	private OrderBulkGenerateJsonSupport() {
	}

	static String toOrderIdsJson(List<Long> orderIds) {
		try {
			return MAPPER.writeValueAsString(orderIds);
		} catch (Exception ex) {
			throw new IllegalStateException("Unable to serialize order IDs for bulk generate.", ex);
		}
	}

	static List<Long> parseOrderIds(String orderIdsJson) {
		if (orderIdsJson == null || orderIdsJson.isBlank()) {
			return Collections.emptyList();
		}
		try {
			return MAPPER.readValue(orderIdsJson, LONG_LIST);
		} catch (Exception ex) {
			throw new IllegalStateException("Unable to parse order IDs for bulk generate.", ex);
		}
	}
}
