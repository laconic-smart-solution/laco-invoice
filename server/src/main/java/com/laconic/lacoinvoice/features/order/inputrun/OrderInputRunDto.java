package com.laconic.lacoinvoice.features.order.inputrun;

import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.OrderInputFileStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputRunStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderInputRunDto")
public record OrderInputRunDto(
		Long id,
		Long storeId,
		String storeName,
		Long marketplaceId,
		String marketplaceCode,
		String title,
		OrderInputRunStatus status,
		String orderDetailFilename,
		Long orderDetailSize,
		OrderInputFileStatus orderDetailStatus,
		String orderDetailError,
		Instant orderDetailStartedAt,
		Instant orderDetailFinishedAt,
		Long orderDetailBatchId,
		Long orderDetailImportFileId,
		String withdrawFilename,
		Long withdrawSize,
		OrderInputFileStatus withdrawStatus,
		String withdrawError,
		Instant withdrawStartedAt,
		Instant withdrawFinishedAt,
		Integer withdrawRowCount,
		Integer withdrawMatchedCount,
		Integer withdrawUnmatchedCount,
		Integer orderCount,
		Integer itemCount,
		Instant createdAt,
		Instant updatedAt) {
}
