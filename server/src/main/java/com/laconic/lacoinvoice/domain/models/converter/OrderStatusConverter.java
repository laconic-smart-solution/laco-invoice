package com.laconic.lacoinvoice.domain.models.converter;

import com.laconic.lacoinvoice.common.persistence.converter.AbstractIntegerEnumConverter;
import com.laconic.lacoinvoice.domain.models.OrderStatus;

import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class OrderStatusConverter extends AbstractIntegerEnumConverter<OrderStatus> {

	public OrderStatusConverter() {
		super(OrderStatus.class);
	}
}
