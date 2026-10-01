package com.laconic.lacoinvoice.features.marketplace;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.Marketplace;

@Component
public class MarketplaceMapper implements BaseMapper<Marketplace, MarketplaceDto> {

	@Override
	public MarketplaceDto toDto(Marketplace entity) {
		if (entity == null) {
			return null;
		}
		return new MarketplaceDto(entity.getId(), entity.getCode(), entity.getName());
	}
}
