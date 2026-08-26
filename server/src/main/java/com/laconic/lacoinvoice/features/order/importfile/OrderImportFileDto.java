package com.laconic.lacoinvoice.features.order.importfile;

import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.OrderImportStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderImportFileDto")
public record OrderImportFileDto(
		Long id,
		Long storeId,
		String storeName,
		Long marketplaceId,
		String marketplaceCode,
		String originalFilename,
		String sheetName,
		Integer rowCount,
		Integer importedOrders,
		Integer importedItems,
		OrderImportStatus status,
		Instant createdAt,
		Instant updatedAt) {
}
