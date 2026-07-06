package com.laconic.lacoinvoice.features.order;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderDetailDto")
public record OrderDetailDto(
		OrderDto order,
		CustomerInfoDto customer,
		List<OrderItemDto> items) {
}
