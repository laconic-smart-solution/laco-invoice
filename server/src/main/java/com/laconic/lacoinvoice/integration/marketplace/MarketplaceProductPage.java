package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;

public record MarketplaceProductPage(List<GatewayProductData> items, int total) {
}
