package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import java.util.Iterator;
import java.util.List;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.ItemReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.repositories.ProductRepository;

@Component
@StepScope
public class MarketplaceProductDetailItemReader implements ItemReader<Product> {

	private final ProductRepository productRepository;

	@Value("#{jobParameters['storeId']}")
	private Long storeId;

	@Value("#{jobParameters['marketplaceCode']}")
	private String marketplaceCode;

	@Value("#{jobParameters['syncRunId']}")
	private Long syncRunId;

	private Iterator<Product> iterator;

	public MarketplaceProductDetailItemReader(ProductRepository productRepository) {
		this.productRepository = productRepository;
	}

	@Override
	public Product read() {
		if (iterator == null) {
			List<Product> products = productRepository.findByStore_IdAndMarketplaceCodeIgnoreCaseAndLastSyncRunId(
					storeId,
					marketplaceCode,
					syncRunId);
			iterator = products.iterator();
		}
		return iterator.hasNext() ? iterator.next() : null;
	}
}
