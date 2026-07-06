package com.laconic.lacoinvoice.integration.cache;

import java.time.Duration;
import java.util.Optional;

public interface MarketplaceTokenCache {

	void putAccessToken(Long storeId, Long marketplaceId, String accessToken, Duration ttl);

	Optional<String> getAccessToken(Long storeId, Long marketplaceId);

	void evictAccessToken(Long storeId, Long marketplaceId);
}
