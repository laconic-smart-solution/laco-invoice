package com.laconic.lacoinvoice.features.store.marketplace;

import java.util.Objects;
import java.util.UUID;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;

public final class MarketplaceConnectionSupport {

	private MarketplaceConnectionSupport() {
	}

	public static StoreMarketplaceConnection upsertConnection(
			StoreMarketplaceConnectionRepository connectionRepository,
			MarketplaceRepository marketplaceRepository,
			Store store,
			String marketplaceCode,
			GatewayStoreData gatewayStore,
			String preferredDisplayName) {
		Marketplace marketplace = marketplaceRepository.findByCodeIgnoreCase(marketplaceCode)
				.orElseThrow(() -> new ResourceNotFoundException("Marketplace not found: code=" + marketplaceCode));

		Long storeId = store.getId();
		StoreMarketplaceConnection connection = resolveExistingConnection(
				connectionRepository,
				storeId,
				marketplaceCode,
				gatewayStore);

		connection.setStore(store);
		connection.setMarketplace(marketplace);
		applyGatewayMetadata(connection, gatewayStore, preferredDisplayName);
		connection.setStatus(MarketplaceConnectionStatus.CONNECTED);
		connection.setAccessToken(gatewayStore.accessToken());
		connection.setRefreshToken(gatewayStore.refreshToken());

		return connectionRepository.save(connection);
	}

	private static StoreMarketplaceConnection resolveExistingConnection(
			StoreMarketplaceConnectionRepository connectionRepository,
			Long storeId,
			String marketplaceCode,
			GatewayStoreData gatewayStore) {
		if (gatewayStore.id() != null) {
			return connectionRepository
					.findByStore_IdAndExternalConnectionId(storeId, gatewayStore.id())
					.orElseGet(() -> connectionRepository
							.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
							.orElse(new StoreMarketplaceConnection()));
		}
		return connectionRepository
				.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
				.orElse(new StoreMarketplaceConnection());
	}

	public static void applyGatewayMetadata(
			StoreMarketplaceConnection connection,
			GatewayStoreData gatewayStore,
			String preferredDisplayName) {
		UUID externalId = gatewayStore.id();
		if (externalId == null) {
			externalId = connection.getExternalConnectionId();
		}
		if (externalId == null) {
			externalId = UUID.randomUUID();
		}
		connection.setExternalConnectionId(externalId);
		connection.setExternalSellerId(gatewayStore.sellerId());
		connection.setExternalCountry(gatewayStore.country());
		connection.setDisplayName(resolveDisplayName(preferredDisplayName, gatewayStore));
		connection.setTokenExpiry(gatewayStore.tokenExpiresAt());
		if (gatewayStore.accessToken() != null) {
			connection.setAccessToken(gatewayStore.accessToken());
		}
		if (gatewayStore.refreshToken() != null) {
			connection.setRefreshToken(gatewayStore.refreshToken());
		}
	}

	public static String resolveDisplayName(String preferred, GatewayStoreData gatewayStore) {
		if (preferred != null && !preferred.isBlank()) {
			return preferred.trim();
		}
		if (gatewayStore.displayName() != null && !gatewayStore.displayName().isBlank()) {
			return gatewayStore.displayName().trim();
		}
		if (gatewayStore.shortCode() != null && !gatewayStore.shortCode().isBlank()) {
			return gatewayStore.shortCode().trim();
		}
		return Objects.toString(gatewayStore.account(), null);
	}
}
