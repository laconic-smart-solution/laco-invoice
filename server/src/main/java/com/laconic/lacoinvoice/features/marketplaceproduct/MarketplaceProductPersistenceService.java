package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductData;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductDetail;

@Service
public class MarketplaceProductPersistenceService {

	private final com.laconic.lacoinvoice.domain.repositories.ProductRepository productRepository;

	public MarketplaceProductPersistenceService(
			com.laconic.lacoinvoice.domain.repositories.ProductRepository productRepository) {
		this.productRepository = productRepository;
	}

	@Transactional
	public UpsertBatchResult upsertListItems(
			Store store,
			String marketplaceCode,
			List<GatewayProductData> items,
			Instant syncStartedAt,
			Long syncRunId) {
		int inserted = 0;
		int updated = 0;
		int skipped = 0;
		if (items == null || items.isEmpty()) {
			return new UpsertBatchResult(inserted, updated, skipped);
		}
		for (GatewayProductData item : items) {
			UpsertResult result = upsertListItemInternal(store, marketplaceCode, item, syncStartedAt, syncRunId);
			switch (result) {
				case INSERTED -> inserted++;
				case UPDATED -> updated++;
				case SKIPPED -> skipped++;
			}
		}
		return new UpsertBatchResult(inserted, updated, skipped);
	}

	public UpsertResult upsertListItem(
			Store store,
			String marketplaceCode,
			GatewayProductData item,
			Instant syncStartedAt,
			Long syncRunId) {
		return upsertListItemInternal(store, marketplaceCode, item, syncStartedAt, syncRunId);
	}

	private UpsertResult upsertListItemInternal(
			Store store,
			String marketplaceCode,
			GatewayProductData item,
			Instant syncStartedAt,
			Long syncRunId) {
		if (item == null || !StringUtils.hasText(item.sku())) {
			return UpsertResult.skipped();
		}
		String externalProductId = item.externalProductId() != null ? item.externalProductId().trim() : "";
		String sku = item.sku().trim();
		BigDecimal price = parsePrice(item.price());

		var existingId = productRepository.findIdByMarketplaceKey(
				store.getId(),
				marketplaceCode,
				externalProductId,
				sku);
		if (existingId.isPresent()) {
			productRepository.updateMarketplaceListFields(
					existingId.get(),
					sku,
					item.name(),
					price,
					item.currency(),
					item.status(),
					syncStartedAt,
					syncRunId);
			return UpsertResult.updated();
		}

		Product product = new Product();
		product.setStore(store);
		product.setMarketplaceCode(marketplaceCode.toUpperCase());
		product.setExternalProductId(externalProductId);
		product.setSku(sku);
		product.setName(item.name());
		product.setPrice(price);
		product.setCurrency(item.currency());
		product.setStatus(item.status());
		product.setLastSyncedAt(syncStartedAt);
		product.setLastSyncRunId(syncRunId);
		productRepository.save(product);
		return UpsertResult.inserted();
	}

	@Transactional
	public void updateDetailFields(Long productId, GatewayProductDetail detail) {
		if (productId == null || detail == null) {
			return;
		}
		productRepository.updateMarketplaceDetailFields(
				productId,
				detail.description(),
				MarketplaceProductJsonSupport.toImagesJson(detail.images()),
				MarketplaceProductJsonSupport.toVariantsJson(detail.variants()));
	}

	@Transactional
	public int softDisableStale(Long storeId, String marketplaceCode, Instant syncStartedAt) {
		return productRepository.softDisableStaleMarketplaceProducts(storeId, marketplaceCode, syncStartedAt);
	}

	private static BigDecimal parsePrice(String rawPrice) {
		if (!StringUtils.hasText(rawPrice)) {
			return BigDecimal.ZERO;
		}
		try {
			return new BigDecimal(rawPrice.trim());
		} catch (NumberFormatException ex) {
			return BigDecimal.ZERO;
		}
	}

	public record UpsertBatchResult(int inserted, int updated, int skipped) {
	}

	public enum UpsertResult {
		INSERTED,
		UPDATED,
		SKIPPED;

		static UpsertResult inserted() {
			return INSERTED;
		}

		static UpsertResult updated() {
			return UPDATED;
		}

		static UpsertResult skipped() {
			return SKIPPED;
		}
	}
}
