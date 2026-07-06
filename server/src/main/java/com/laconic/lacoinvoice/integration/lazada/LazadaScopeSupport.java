package com.laconic.lacoinvoice.integration.lazada;

import java.util.UUID;

import com.laconic.lacoinvoice.integration.marketplace.MarketplaceScopeSupport;

/**
 * Lazada-specific scope helpers; delegates to {@link MarketplaceScopeSupport}.
 */
public final class LazadaScopeSupport {

	private static final String LAZADA_CODE = "LAZADA";

	private LazadaScopeSupport() {
	}

	public static UUID toTenantUuid(Long storeId) {
		return MarketplaceScopeSupport.toTenantUuid(storeId);
	}

	public static UUID toActorUuid(Long userId) {
		return MarketplaceScopeSupport.toActorUuid(userId);
	}

	public static String buildOAuthState(Long storeId) {
		return MarketplaceScopeSupport.buildOAuthState(storeId, LAZADA_CODE);
	}

	public static Long parseStoreIdFromState(String state) {
		return MarketplaceScopeSupport.parseStoreIdFromState(state);
	}
}
