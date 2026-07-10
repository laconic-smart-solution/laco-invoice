package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.Product;

@Component
@StepScope
public class MarketplaceProductDetailEnrichWriter implements ItemWriter<Product> {

	@Override
	public void write(Chunk<? extends Product> chunk) {
		// Detail progress is persisted in the processor via MarketplaceProductSyncProgressService.
	}
}
