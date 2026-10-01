package com.laconic.lacoinvoice.features.order.history;

public record OrderHistoryChangeDto(
		String field,
		String fieldLabelKey,
		String before,
		String after,
		String valueType) {
}
