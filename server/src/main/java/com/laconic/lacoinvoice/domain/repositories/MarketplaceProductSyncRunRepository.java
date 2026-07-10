package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncRun;
import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncStatus;

@Repository
public interface MarketplaceProductSyncRunRepository extends BaseRepository<MarketplaceProductSyncRun> {

	boolean existsByStoreIdAndMarketplaceCodeIgnoreCaseAndStatus(
			Long storeId,
			String marketplaceCode,
			MarketplaceProductSyncStatus status);

	Optional<MarketplaceProductSyncRun> findFirstByStoreIdAndMarketplaceCodeIgnoreCaseOrderByStartedAtDesc(
			Long storeId,
			String marketplaceCode);

	List<MarketplaceProductSyncRun> findByStoreIdAndMarketplaceCodeIgnoreCaseAndStatus(
			Long storeId,
			String marketplaceCode,
			MarketplaceProductSyncStatus status);
}
