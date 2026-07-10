package com.laconic.lacoinvoice.features.marketplaceproduct;

final class MarketplaceProductErpSupport {

	private MarketplaceProductErpSupport() {
	}

	static MarketplaceProductErpDetailDto derivePlaceholderErp(String externalProductId, String sku) {
		String key = externalProductId + ":" + sku;
		int hash = 0;
		for (int index = 0; index < key.length(); index += 1) {
			hash = (hash + key.charAt(index)) % 100;
		}
		boolean synced = hash > 55;
		if (synced) {
			return new MarketplaceProductErpDetailDto(
					"SYNCED",
					null,
					null,
					sku,
					null,
					null);
		}
		return new MarketplaceProductErpDetailDto(
				"UNMAPPED",
				null,
				null,
				null,
				null,
				null);
	}
}
