package com.laconic.lacoinvoice.features.erp;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.ErpItem;

@Component
public class ErpItemMapper implements BaseMapper<ErpItem, ErpItemDto> {

	@Override
	public ErpItemDto toDto(ErpItem entity) {
		if (entity == null) {
			return null;
		}
		return new ErpItemDto(
				entity.getId(),
				entity.getErpCode(),
				entity.getName(),
				entity.getDescription(),
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}
}
