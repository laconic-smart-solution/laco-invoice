package com.laconic.lacoinvoice.features.purchaseorder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.PurchaseOrderStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoicePurchaseOrderItemDto")
public record PurchaseOrderItemDto(
		Long id,
		Long erpItemId,
		String erpCode,
		String erpItemName,
		Integer quantity,
		BigDecimal unitPrice) {
}
