package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

public interface MarketplaceOrderAdapter {

	boolean supports(String marketplaceCode);

	List<MarketplaceFetchedOrder> fetchOrders(StoreMarketplaceConnection connection);
}
