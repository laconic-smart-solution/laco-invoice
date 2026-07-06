package com.laconic.lacoinvoice.integration.cache;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnBean(StringRedisTemplate.class)
public class RedisMarketplaceTokenCache implements MarketplaceTokenCache {

	private static final String KEY_PREFIX = "lacoinvoice:marketplace:token:";

	private final StringRedisTemplate redisTemplate;

	public RedisMarketplaceTokenCache(StringRedisTemplate redisTemplate) {
		this.redisTemplate = redisTemplate;
	}

	@Override
	public void putAccessToken(Long storeId, Long marketplaceId, String accessToken, Duration ttl) {
		if (storeId == null || marketplaceId == null || accessToken == null) {
			return;
		}
		redisTemplate.opsForValue().set(key(storeId, marketplaceId), accessToken, ttl.toSeconds(), TimeUnit.SECONDS);
	}

	@Override
	public Optional<String> getAccessToken(Long storeId, Long marketplaceId) {
		return Optional.ofNullable(redisTemplate.opsForValue().get(key(storeId, marketplaceId)));
	}

	@Override
	public void evictAccessToken(Long storeId, Long marketplaceId) {
		redisTemplate.delete(key(storeId, marketplaceId));
	}

	private static String key(Long storeId, Long marketplaceId) {
		return KEY_PREFIX + storeId + ":" + marketplaceId;
	}
}
