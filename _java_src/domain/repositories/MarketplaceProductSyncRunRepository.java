package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

	@Modifying
	@Query(value = """
			UPDATE marketplace_product_sync_runs
			SET inserted_count = inserted_count + :delta,
			    updated_at = SYSTIMESTAMP
			WHERE id = :syncRunId AND is_enable = 1
			""", nativeQuery = true)
	int incrementInserted(@Param("syncRunId") Long syncRunId, @Param("delta") int delta);

	@Modifying
	@Query(value = """
			UPDATE marketplace_product_sync_runs
			SET updated_count = updated_count + :delta,
			    updated_at = SYSTIMESTAMP
			WHERE id = :syncRunId AND is_enable = 1
			""", nativeQuery = true)
	int incrementUpdated(@Param("syncRunId") Long syncRunId, @Param("delta") int delta);

	@Modifying
	@Query(value = """
			UPDATE marketplace_product_sync_runs
			SET failed_count = failed_count + :delta,
			    updated_at = SYSTIMESTAMP
			WHERE id = :syncRunId AND is_enable = 1
			""", nativeQuery = true)
	int incrementFailed(@Param("syncRunId") Long syncRunId, @Param("delta") int delta);

	@Modifying
	@Query(value = """
			UPDATE marketplace_product_sync_runs
			SET disabled_count = :count,
			    updated_at = SYSTIMESTAMP
			WHERE id = :syncRunId AND is_enable = 1
			""", nativeQuery = true)
	int setDisabledCount(@Param("syncRunId") Long syncRunId, @Param("count") int count);
}
