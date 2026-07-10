package com.laconic.lacoinvoice.features.store;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

@Component
public class StoreMapper implements BaseMapper<Store, StoreDto> {

	@Override
	public StoreDto toDto(Store entity) {
		if (entity == null) {
			return null;
		}
		Long ownerId = entity.getOwner() != null ? entity.getOwner().getId() : null;
		return new StoreDto(
				entity.getId(),
				ownerId,
				entity.getName(),
				entity.getLogoUrl(),
				entity.isActive(),
				entity.getCreatedAt());
	}

	public StoreMarketplaceConnectionDto toConnectionDto(StoreMarketplaceConnection entity) {
		if (entity == null) {
			return null;
		}
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		Long marketplaceId = entity.getMarketplace() != null ? entity.getMarketplace().getId() : null;
		String marketplaceCode = entity.getMarketplace() != null ? entity.getMarketplace().getCode() : null;
		String marketplaceName = entity.getMarketplace() != null ? entity.getMarketplace().getName() : null;
		return new StoreMarketplaceConnectionDto(
				entity.getId(),
				storeId,
				marketplaceId,
				marketplaceCode,
				marketplaceName,
				entity.getExternalConnectionId(),
				entity.getExternalSellerId(),
				entity.getExternalCountry(),
				entity.getDisplayName(),
				entity.getTokenExpiry(),
				entity.getStatus(),
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}
}
