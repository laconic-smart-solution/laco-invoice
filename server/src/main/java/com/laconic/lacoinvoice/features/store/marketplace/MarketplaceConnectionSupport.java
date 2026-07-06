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
		StoreMarketplaceConnection connection = connectionRepository
				.findByStore_IdAndExternalConnectionId(storeId, gatewayStore.id())
				.orElseGet(() -> connectionRepository
						.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
						.orElse(new StoreMarketplaceConnection()));

		connection.setStore(store);
		connection.setMarketplace(marketplace);
		applyGatewayMetadata(connection, gatewayStore, preferredDisplayName);
		connection.setStatus(MarketplaceConnectionStatus.CONNECTED);
		connection.setAccessToken(null);
		connection.setRefreshToken(null);

		return connectionRepository.save(connection);
	}

	public static void applyGatewayMetadata(
			StoreMarketplaceConnection connection,
			GatewayStoreData gatewayStore,
			String preferredDisplayName) {
		connection.setExternalConnectionId(gatewayStore.id());
		connection.setExternalSellerId(gatewayStore.sellerId());
		connection.setExternalCountry(gatewayStore.country());
		connection.setDisplayName(resolveDisplayName(preferredDisplayName, gatewayStore));
		connection.setTokenExpiry(gatewayStore.tokenExpiresAt());
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
