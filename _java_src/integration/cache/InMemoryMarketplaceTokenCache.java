package com.laconic.lacoinvoice.integration.cache;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(StringRedisTemplate.class)
public class InMemoryMarketplaceTokenCache implements MarketplaceTokenCache {

	private record CacheEntry(String token, Instant expiresAt) {
	}

	private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

	@Override
	public void putAccessToken(Long storeId, Long marketplaceId, String accessToken, Duration ttl) {
		if (storeId == null || marketplaceId == null || accessToken == null) {
			return;
		}
		cache.put(key(storeId, marketplaceId), new CacheEntry(accessToken, Instant.now().plus(ttl)));
	}

	@Override
	public Optional<String> getAccessToken(Long storeId, Long marketplaceId) {
		CacheEntry entry = cache.get(key(storeId, marketplaceId));
		if (entry == null) {
			return Optional.empty();
		}
		if (entry.expiresAt().isBefore(Instant.now())) {
			cache.remove(key(storeId, marketplaceId));
			return Optional.empty();
		}
		return Optional.of(entry.token());
	}

	@Override
	public void evictAccessToken(Long storeId, Long marketplaceId) {
		cache.remove(key(storeId, marketplaceId));
	}

	private static String key(Long storeId, Long marketplaceId) {
		return storeId + ":" + marketplaceId;
	}
}
