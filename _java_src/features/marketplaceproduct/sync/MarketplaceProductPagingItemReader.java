package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import java.util.Iterator;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.ItemReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductData;
import com.laconic.lacoinvoice.integration.marketplace.product.MarketplaceProductAdapterRegistry;
import com.laconic.lacoinvoice.integration.marketplace.product.MarketplaceProductPage;

@Component
@StepScope
public class MarketplaceProductPagingItemReader implements ItemReader<GatewayProductData> {

	private static final int PAGE_LIMIT = 100;

	private final StoreRepository storeRepository;
	private final StoreMarketplaceConnectionRepository connectionRepository;
	private final MarketplaceProductAdapterRegistry adapterRegistry;

	@Value("#{jobParameters['storeId']}")
	private Long storeId;

	@Value("#{jobParameters['marketplaceCode']}")
	private String marketplaceCode;

	private StoreMarketplaceConnection connection;
	private Iterator<GatewayProductData> currentPageIterator;
	private int nextPage = 1;
	private boolean finished;

	public MarketplaceProductPagingItemReader(
			StoreRepository storeRepository,
			StoreMarketplaceConnectionRepository connectionRepository,
			MarketplaceProductAdapterRegistry adapterRegistry) {
		this.storeRepository = storeRepository;
		this.connectionRepository = connectionRepository;
		this.adapterRegistry = adapterRegistry;
	}

	@Override
	public GatewayProductData read() {
		if (finished) {
			return null;
		}
		ensureConnection();
		if (connection == null) {
			finished = true;
			return null;
		}
		if (currentPageIterator == null || !currentPageIterator.hasNext()) {
			if (!loadNextPage()) {
				finished = true;
				return null;
			}
		}
		return currentPageIterator.hasNext() ? currentPageIterator.next() : read();
	}

	private void ensureConnection() {
		if (connection != null || storeId == null || marketplaceCode == null) {
			return;
		}
		Store store = storeRepository.findById(storeId).orElse(null);
		if (store == null) {
			return;
		}
		connection = connectionRepository
				.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
				.orElse(null);
	}

	private boolean loadNextPage() {
		if (connection == null) {
			return false;
		}
		MarketplaceProductPage page = adapterRegistry.resolve(marketplaceCode)
				.fetchProductPage(connection, nextPage, PAGE_LIMIT, null);
		nextPage += 1;
		if (page == null || page.items() == null || page.items().isEmpty()) {
			return false;
		}
		currentPageIterator = page.items().iterator();
		return true;
	}
}
