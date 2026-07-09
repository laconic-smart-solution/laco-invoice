package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class MarketplaceProductAdapterRegistry {

	private final List<MarketplaceProductAdapter> adapters;

	public MarketplaceProductAdapterRegistry(List<MarketplaceProductAdapter> adapters) {
		this.adapters = adapters;
	}

	public MarketplaceProductAdapter resolve(String marketplaceCode) {
		if (marketplaceCode == null || marketplaceCode.isBlank()) {
			throw new IllegalArgumentException("Marketplace code is required.");
		}
		return adapters.stream()
				.filter(adapter -> adapter.supports(marketplaceCode))
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException(
						"No marketplace product adapter registered for code=" + marketplaceCode));
	}
}
