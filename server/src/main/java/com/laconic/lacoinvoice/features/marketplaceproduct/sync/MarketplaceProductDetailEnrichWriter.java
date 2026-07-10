package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.Product;

@Component
@StepScope
public class MarketplaceProductDetailEnrichWriter implements ItemWriter<Product> {

	private final MarketplaceProductSyncRunContext syncRunContext;

	public MarketplaceProductDetailEnrichWriter(MarketplaceProductSyncRunContext syncRunContext) {
		this.syncRunContext = syncRunContext;
	}

	@Override
	public void write(Chunk<? extends Product> chunk) {
		syncRunContext.save();
	}
}
