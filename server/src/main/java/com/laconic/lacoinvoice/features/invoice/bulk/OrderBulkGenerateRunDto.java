package com.laconic.lacoinvoice.features.invoice.bulk;

import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "OrderBulkGenerateRunDto")
public record OrderBulkGenerateRunDto(
		Long id,
		OrderBulkGenerateStatus status,
		int totalCount,
		int processedCount,
		int successCount,
		int failedCount,
		String zipFilename,
		String errorMessage,
		Instant startedAt,
		Instant completedAt) {
}
