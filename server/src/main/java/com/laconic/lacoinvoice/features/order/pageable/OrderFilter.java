package com.laconic.lacoinvoice.features.order.pageable;

import com.laconic.lacoinvoice.domain.models.OrderSourceType;
import com.laconic.lacoinvoice.domain.models.OrderStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceOrderFilter")
public class OrderFilter {

	private OrderStatus orderStatus;

	private OrderSourceType sourceType;

	private Long sourceId;

	private String externalOrderId;

	private Long storeId;

	private Long marketplaceId;

	private String marketplaceCode;
}
