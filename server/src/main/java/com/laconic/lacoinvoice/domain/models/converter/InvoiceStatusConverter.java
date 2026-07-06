package com.laconic.lacoinvoice.domain.models.converter;

import com.laconic.lacoinvoice.common.persistence.converter.AbstractIntegerEnumConverter;
import com.laconic.lacoinvoice.domain.models.InvoiceStatus;

import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InvoiceStatusConverter extends AbstractIntegerEnumConverter<InvoiceStatus> {

	public InvoiceStatusConverter() {
		super(InvoiceStatus.class);
	}
}
