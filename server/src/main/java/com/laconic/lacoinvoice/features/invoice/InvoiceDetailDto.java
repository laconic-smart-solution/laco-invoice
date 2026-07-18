package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceInvoiceDetailDto")
public record InvoiceDetailDto(
		InvoiceDto invoice,
		Long storeId,
		String storeName,
		String marketplaceCode,
		String externalOrderId,
		String currency,
		BigDecimal shippingFee,
		String customerName,
		String customerEmail,
		String customerPhone,
		String customerAddress,
		List<InvoiceLineItemDto> items) {
}
