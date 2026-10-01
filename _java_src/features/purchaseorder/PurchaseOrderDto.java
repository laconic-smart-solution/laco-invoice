package com.laconic.lacoinvoice.features.purchaseorder;

import java.time.Instant;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.PurchaseOrderStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoicePurchaseOrderDto")
public record PurchaseOrderDto(
		Long id,
		String poNumber,
		PurchaseOrderStatus status,
		Instant createdAt,
		Instant updatedAt,
		List<PurchaseOrderItemDto> items) {
}
