package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceItemLineDto(
		Long id,
		Long orderId,
		String externalOrderId,
		LocalDate orderDate,
		String platformSkuId,
		String sellerSku,
		String productName,
		String variation,
		Integer quantity,
		BigDecimal unitPrice,
		BigDecimal subtotal,
		BigDecimal discount,
		BigDecimal totalAmount) {
}
