package com.laconic.lacoinvoice.features.store;

import java.time.Instant;
import java.util.UUID;

import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceStoreMarketplaceConnectionDto")
public record StoreMarketplaceConnectionDto(
		Long id,
		Long storeId,
		Long marketplaceId,
		String marketplaceCode,
		String marketplaceName,
		UUID externalConnectionId,
		String externalSellerId,
		String externalCountry,
		String displayName,
		Instant tokenExpiry,
		MarketplaceConnectionStatus status,
		Instant createdAt,
		Instant updatedAt) {
}
