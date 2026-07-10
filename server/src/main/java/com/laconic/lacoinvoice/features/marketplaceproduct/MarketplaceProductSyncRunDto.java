package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MarketplaceProductSyncRunDto")
public record MarketplaceProductSyncRunDto(
		Long id,
		Long storeId,
		String marketplaceCode,
		MarketplaceProductSyncStatus status,
		int insertedCount,
		int updatedCount,
		int disabledCount,
		int failedCount,
		String errorMessage,
		Instant startedAt,
		Instant completedAt) {
}
