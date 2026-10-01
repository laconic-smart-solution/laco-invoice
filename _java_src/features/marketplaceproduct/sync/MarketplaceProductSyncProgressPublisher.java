package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductSyncRunDto;

@Component
public class MarketplaceProductSyncProgressPublisher {

	public static final String CHANNEL = "marketplace-product-sync:progress";

	private static final Logger log = LoggerFactory.getLogger(MarketplaceProductSyncProgressPublisher.class);

	private final StringRedisTemplate redisTemplate;

	public MarketplaceProductSyncProgressPublisher(StringRedisTemplate redisTemplate) {
		this.redisTemplate = redisTemplate;
	}

	public void publish(MarketplaceProductSyncRunDto dto) {
		if (dto == null) {
			return;
		}
		try {
			redisTemplate.convertAndSend(CHANNEL, MarketplaceProductSyncProgressJson.toJson(dto));
		} catch (Exception ex) {
			log.warn("Failed to publish marketplace product sync progress for run id={}", dto.id(), ex);
		}
	}
}
