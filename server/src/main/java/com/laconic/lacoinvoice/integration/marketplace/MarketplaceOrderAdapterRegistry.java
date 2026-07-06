package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class MarketplaceOrderAdapterRegistry {

	private final List<MarketplaceOrderAdapter> adapters;

	public MarketplaceOrderAdapterRegistry(List<MarketplaceOrderAdapter> adapters) {
		this.adapters = adapters;
	}

	public MarketplaceOrderAdapter resolve(String marketplaceCode) {
		if (marketplaceCode == null || marketplaceCode.isBlank()) {
			throw new IllegalArgumentException("Marketplace code is required.");
		}
		return adapters.stream()
				.filter(adapter -> adapter.supports(marketplaceCode))
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException(
						"No marketplace adapter registered for code=" + marketplaceCode));
	}
}
