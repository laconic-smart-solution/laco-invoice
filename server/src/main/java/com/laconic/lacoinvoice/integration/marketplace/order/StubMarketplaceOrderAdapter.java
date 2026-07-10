package com.laconic.lacoinvoice.integration.marketplace.order;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

/**
 * Placeholder adapter for all supported marketplaces until real API clients are wired.
 */
@Component
public class StubMarketplaceOrderAdapter implements MarketplaceOrderAdapter {

	private static final Logger log = LoggerFactory.getLogger(StubMarketplaceOrderAdapter.class);

	private static final Set<String> SUPPORTED = Set.of("AMAZON");

	@Override
	public boolean supports(String marketplaceCode) {
		return marketplaceCode != null && SUPPORTED.contains(marketplaceCode.trim().toUpperCase());
	}

	@Override
	public List<MarketplaceFetchedOrder> fetchOrders(StoreMarketplaceConnection connection) {
		String code = connection.getMarketplace() != null ? connection.getMarketplace().getCode() : "unknown";
		log.info(
				"Stub marketplace sync: storeId={} marketplace={} — no orders fetched (adapter not implemented)",
				connection.getStore() != null ? connection.getStore().getId() : null,
				code);
		return Collections.emptyList();
	}
}
