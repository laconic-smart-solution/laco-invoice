package com.laconic.lacoinvoice.integration.marketplace.order;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

public abstract class AbstractMarketplaceOrderAdapter implements MarketplaceOrderAdapter {

	private static final Logger log = LoggerFactory.getLogger(AbstractMarketplaceOrderAdapter.class);

	private final String marketplaceCode;

	protected AbstractMarketplaceOrderAdapter(String marketplaceCode) {
		this.marketplaceCode = marketplaceCode;
	}

	@Override
	public boolean supports(String code) {
		return code != null && marketplaceCode.equalsIgnoreCase(code.trim());
	}

	@Override
	public List<MarketplaceFetchedOrder> fetchOrders(StoreMarketplaceConnection connection) {
		if (connection.getExternalConnectionId() == null) {
			log.warn("Skipping order sync for {} connection without external id", marketplaceCode);
			return Collections.emptyList();
		}
		try {
			List<GatewayOrderData> orders = fetchFromGateway(connection, null);
			return orders.stream().map(this::toFetchedOrder).toList();
		} catch (Exception e) {
			log.error("Failed to fetch {} orders for storeId={}", marketplaceCode,
					connection.getStore() != null ? connection.getStore().getId() : null, e);
			return Collections.emptyList();
		}
	}

	protected abstract List<GatewayOrderData> fetchFromGateway(
			StoreMarketplaceConnection connection,
			String updatedFrom);

	private MarketplaceFetchedOrder toFetchedOrder(GatewayOrderData order) {
		BigDecimal total = BigDecimal.ZERO;
		try {
			if (order.totalAmount() != null && !order.totalAmount().isBlank()) {
				total = new BigDecimal(order.totalAmount());
			}
		} catch (NumberFormatException ignored) {
			total = BigDecimal.ZERO;
		}
		return new MarketplaceFetchedOrder(
				order.externalOrderId(),
				null,
				order.status(),
				total,
				BigDecimal.ZERO,
				total,
				order.orderedAt(),
				null,
				null,
				null,
				List.of());
	}
}
