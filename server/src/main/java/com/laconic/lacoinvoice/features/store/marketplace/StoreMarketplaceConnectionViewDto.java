package com.laconic.lacoinvoice.features.store.marketplace;

import java.time.Instant;
import java.util.UUID;

import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "StoreMarketplaceConnectionViewDto")
public record StoreMarketplaceConnectionViewDto(
		String marketplaceCode,
		Long localConnectionId,
		UUID externalConnectionId,
		Long storeId,
		String sellerId,
		String displayName,
		String country,
		String account,
		String shortCode,
		Instant tokenExpiresAt,
		Instant refreshExpiresAt,
		MarketplaceConnectionStatus status,
		Instant createdAt) {

	public static StoreMarketplaceConnectionViewDto fromEntity(
			String marketplaceCode,
			StoreMarketplaceConnection entity) {
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		return new StoreMarketplaceConnectionViewDto(
				marketplaceCode,
				entity.getId(),
				entity.getExternalConnectionId(),
				storeId,
				entity.getExternalSellerId(),
				entity.getDisplayName(),
				entity.getExternalCountry(),
				null,
				null,
				entity.getTokenExpiry(),
				null,
				entity.getStatus(),
				entity.getCreatedAt());
	}

	public static StoreMarketplaceConnectionViewDto from(
			String marketplaceCode,
			Long storeId,
			GatewayStoreData gatewayStore,
			StoreMarketplaceConnection local) {
		MarketplaceConnectionStatus status = local != null
				? local.getStatus()
				: MarketplaceConnectionStatus.CONNECTED;

		return new StoreMarketplaceConnectionViewDto(
				marketplaceCode,
				local != null ? local.getId() : null,
				gatewayStore.id(),
				storeId,
				gatewayStore.sellerId(),
				MarketplaceConnectionSupport.resolveDisplayName(
						local != null ? local.getDisplayName() : null,
						gatewayStore),
				gatewayStore.country(),
				gatewayStore.account(),
				gatewayStore.shortCode(),
				gatewayStore.tokenExpiresAt(),
				gatewayStore.refreshExpiresAt(),
				status,
				gatewayStore.createdAt());
	}
}
