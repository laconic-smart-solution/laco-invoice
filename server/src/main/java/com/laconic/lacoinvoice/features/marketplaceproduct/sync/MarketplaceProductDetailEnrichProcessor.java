package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductPersistenceService;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductDetail;
import com.laconic.lacoinvoice.integration.marketplace.product.MarketplaceProductAdapterRegistry;

@Component
@StepScope
public class MarketplaceProductDetailEnrichProcessor implements ItemProcessor<Product, Product> {

	private final StoreMarketplaceConnectionRepository connectionRepository;
	private final MarketplaceProductAdapterRegistry adapterRegistry;
	private final MarketplaceProductPersistenceService persistenceService;
	private final MarketplaceProductSyncProgressService progressService;
	private final MarketplaceProductSyncDetailThrottler detailThrottler;

	@Value("#{jobParameters['storeId']}")
	private Long storeId;

	@Value("#{jobParameters['marketplaceCode']}")
	private String marketplaceCode;

	@Value("#{jobParameters['syncRunId']}")
	private Long syncRunId;

	private StoreMarketplaceConnection connection;

	public MarketplaceProductDetailEnrichProcessor(
			StoreMarketplaceConnectionRepository connectionRepository,
			MarketplaceProductAdapterRegistry adapterRegistry,
			MarketplaceProductPersistenceService persistenceService,
			MarketplaceProductSyncProgressService progressService,
			MarketplaceProductSyncDetailThrottler detailThrottler) {
		this.connectionRepository = connectionRepository;
		this.adapterRegistry = adapterRegistry;
		this.persistenceService = persistenceService;
		this.progressService = progressService;
		this.detailThrottler = detailThrottler;
	}

	@Override
	public Product process(Product product) {
		ensureConnection();
		if (connection == null || product == null) {
			return product;
		}
		try {
			detailThrottler.awaitTurn(marketplaceCode);
			GatewayProductDetail detail = adapterRegistry.resolve(marketplaceCode)
					.fetchProductDetail(connection, product.getExternalProductId(), product.getSku());
			persistenceService.updateDetailFields(product.getId(), detail);
		} catch (Exception ex) {
			progressService.incrementFailed(syncRunId);
		}
		return product;
	}

	private void ensureConnection() {
		if (connection == null && storeId != null && marketplaceCode != null) {
			connection = connectionRepository
					.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
					.orElse(null);
		}
	}
}
