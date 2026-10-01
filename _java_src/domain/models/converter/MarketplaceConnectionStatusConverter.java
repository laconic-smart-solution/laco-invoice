package com.laconic.lacoinvoice.domain.models.converter;

import com.laconic.lacoinvoice.common.persistence.converter.AbstractIntegerEnumConverter;
import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;

import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MarketplaceConnectionStatusConverter
		extends AbstractIntegerEnumConverter<MarketplaceConnectionStatus> {

	public MarketplaceConnectionStatusConverter() {
		super(MarketplaceConnectionStatus.class);
	}
}
