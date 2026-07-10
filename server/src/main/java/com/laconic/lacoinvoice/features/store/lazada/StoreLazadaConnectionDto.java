package com.laconic.lacoinvoice.features.store.lazada;

import java.time.Instant;
import java.util.UUID;

import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceStoreLazadaConnectionDto")
public record StoreLazadaConnectionDto(
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
}
