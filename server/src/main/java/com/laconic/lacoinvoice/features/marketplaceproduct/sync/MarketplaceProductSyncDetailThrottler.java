package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.config.MarketplaceProductSyncProperties;

@Component
public class MarketplaceProductSyncDetailThrottler {

	private final long delayMs;
	private final Map<String, Object> locks = new ConcurrentHashMap<>();
	private final Map<String, Long> lastRequestAtByMarketplace = new ConcurrentHashMap<>();

	public MarketplaceProductSyncDetailThrottler(MarketplaceProductSyncProperties properties) {
		this.delayMs = Math.max(0, properties.getDetailRequestDelayMs());
	}

	public void awaitTurn(String marketplaceCode) {
		if (delayMs <= 0) {
			return;
		}
		String key = normalizeMarketplaceCode(marketplaceCode);
		Object lock = locks.computeIfAbsent(key, ignored -> new Object());
		synchronized (lock) {
			Long lastRequestAt = lastRequestAtByMarketplace.get(key);
			if (lastRequestAt != null) {
				long elapsed = System.currentTimeMillis() - lastRequestAt;
				long waitMs = delayMs - elapsed;
				if (waitMs > 0) {
					sleep(waitMs);
				}
			}
			lastRequestAtByMarketplace.put(key, System.currentTimeMillis());
		}
	}

	private static String normalizeMarketplaceCode(String marketplaceCode) {
		return StringUtils.hasText(marketplaceCode) ? marketplaceCode.trim().toUpperCase() : "DEFAULT";
	}

	private static void sleep(long waitMs) {
		try {
			Thread.sleep(waitMs);
		} catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
		}
	}
}
