package com.laconic.lacoinvoice.features.order.history;

import java.time.Instant;
import java.util.List;

public record OrderHistoryEventDto(
		Long id,
		String action,
		String source,
		Long updatedByUserId,
		String updatedBy,
		Instant updatedAt,
		Long importFileId,
		String excelFileName,
		String note,
		List<OrderHistoryChangeDto> changes) {
}
