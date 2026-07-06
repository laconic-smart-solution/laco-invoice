package com.laconic.lacoinvoice.features.invoice;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceInvoiceDetailDto")
public record InvoiceDetailDto(
		InvoiceDto invoice,
		Long storeId,
		String externalOrderId) {
}
