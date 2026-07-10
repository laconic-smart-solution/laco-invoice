package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductPersistenceService;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductData;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
@StepScope
public class MarketplaceProductListUpsertWriter implements ItemWriter<GatewayProductData> {

	private final StoreRepository storeRepository;
	private final MarketplaceProductPersistenceService persistenceService;
	private final MarketplaceProductSyncRunContext syncRunContext;

	@Value("#{jobParameters['storeId']}")
	private Long storeId;

	@Value("#{jobParameters['marketplaceCode']}")
	private String marketplaceCode;

	@Value("#{jobParameters['syncStartedAt']}")
	private String syncStartedAt;

	@Value("#{jobParameters['syncRunId']}")
	private Long syncRunId;

	private Store store;

	public MarketplaceProductListUpsertWriter(
			StoreRepository storeRepository,
			MarketplaceProductPersistenceService persistenceService,
			MarketplaceProductSyncRunContext syncRunContext) {
		this.storeRepository = storeRepository;
		this.persistenceService = persistenceService;
		this.syncRunContext = syncRunContext;
	}

	@Override
	public void write(Chunk<? extends GatewayProductData> chunk) {
		ensureStore();
		if (store == null) {
			return;
		}
		Instant startedAt = Instant.parse(syncStartedAt);
		List<GatewayProductData> items = new ArrayList<>(chunk.getItems());
		var batchResult = persistenceService.upsertListItems(
				store,
				marketplaceCode,
				items,
				startedAt,
				syncRunId);
		syncRunContext.recordUpsertBatch(batchResult);
		syncRunContext.save();
	}

	private void ensureStore() {
		if (store == null && storeId != null) {
			store = storeRepository.findById(storeId).orElse(null);
		}
	}
}
