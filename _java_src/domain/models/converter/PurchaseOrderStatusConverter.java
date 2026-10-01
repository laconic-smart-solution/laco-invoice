package com.laconic.lacoinvoice.domain.models.converter;

import com.laconic.lacoinvoice.common.persistence.converter.AbstractIntegerEnumConverter;
import com.laconic.lacoinvoice.domain.models.PurchaseOrderStatus;

import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PurchaseOrderStatusConverter extends AbstractIntegerEnumConverter<PurchaseOrderStatus> {

	public PurchaseOrderStatusConverter() {
		super(PurchaseOrderStatus.class);
	}
}
