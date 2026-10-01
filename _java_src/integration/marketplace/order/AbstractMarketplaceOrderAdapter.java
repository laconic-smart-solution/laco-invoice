package com.laconic.lacoinvoice.integration.marketplace.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

public abstract class AbstractMarketplaceOrderAdapter implements MarketplaceOrderAdapter {

	private static final Logger log = LoggerFactory.getLogger(AbstractMarketplaceOrderAdapter.class);
	private static final int ORDER_PAGE_SIZE = 100;
	private static final int DEFAULT_LOOKBACK_DAYS = 90;

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
			String updatedFrom = Instant.now().minus(DEFAULT_LOOKBACK_DAYS, ChronoUnit.DAYS).toString();
			List<GatewayOrderData> allOrders = new ArrayList<>();
			for (int page = 1; ; page++) {
				List<GatewayOrderData> pageOrders = fetchFromGateway(connection, updatedFrom, page, ORDER_PAGE_SIZE);
				if (pageOrders.isEmpty()) {
					break;
				}
				allOrders.addAll(pageOrders);
				if (pageOrders.size() < ORDER_PAGE_SIZE) {
					break;
				}
			}
			return allOrders.stream().map(this::toFetchedOrder).toList();
		} catch (Exception e) {
			log.error("Failed to fetch {} orders for storeId={}", marketplaceCode,
					connection.getStore() != null ? connection.getStore().getId() : null, e);
			return Collections.emptyList();
		}
	}

	protected abstract List<GatewayOrderData> fetchFromGateway(
			StoreMarketplaceConnection connection,
			String updatedFrom,
			int page,
			int limit);

	private MarketplaceFetchedOrder toFetchedOrder(GatewayOrderData order) {
		BigDecimal total = BigDecimal.ZERO;
		try {
			if (order.totalAmount() != null && !order.totalAmount().isBlank()) {
				total = new BigDecimal(order.totalAmount());
			}
		} catch (NumberFormatException ignored) {
			total = BigDecimal.ZERO;
		}
		List<MarketplaceFetchedOrderItem> items = List.of();
		if (order.items() != null && !order.items().isEmpty()) {
			items = order.items().stream()
					.map(line -> new MarketplaceFetchedOrderItem(
							line.sku(),
							line.productName(),
							line.price() != null ? line.price() : BigDecimal.ZERO,
							line.quantity(),
							line.lineTotal() != null ? line.lineTotal() : BigDecimal.ZERO,
							null))
					.toList();
		}
		return new MarketplaceFetchedOrder(
				order.externalOrderId(),
				null,
				order.status(),
				total,
				BigDecimal.ZERO,
				total,
				order.currency(),
				order.orderedAt(),
				order.customerName(),
				order.customerEmail(),
				order.customerPhone(),
				null,
				order.customerAddress(),
				order.externalCustomerId(),
				items);
	}
}
