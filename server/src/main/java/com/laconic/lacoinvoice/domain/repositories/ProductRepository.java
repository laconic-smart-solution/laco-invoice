package com.laconic.lacoinvoice.domain.repositories;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.Product;

@Repository
public interface ProductRepository extends BaseRepository<Product> {

	Optional<Product> findByStore_IdAndSkuIgnoreCase(Long storeId, String sku);

	boolean existsByStore_IdAndSkuIgnoreCase(Long storeId, String sku);

	boolean existsByStore_IdAndSkuIgnoreCaseAndIdNot(Long storeId, String sku, Long id);

	Page<Product> findByStore_IdAndMarketplaceCodeIgnoreCase(
			Long storeId,
			String marketplaceCode,
			Pageable pageable);

	List<Product> findByStore_IdAndMarketplaceCodeIgnoreCaseAndLastSyncedAtGreaterThanEqual(
			Long storeId,
			String marketplaceCode,
			Instant lastSyncedAt);

	List<Product> findByStore_IdAndMarketplaceCodeIgnoreCaseAndLastSyncRunId(
			Long storeId,
			String marketplaceCode,
			Long lastSyncRunId);

	@Query(value = """
			SELECT id FROM products
			WHERE store_id = :storeId
			  AND UPPER(marketplace_code) = UPPER(:marketplaceCode)
			  AND external_product_id = :externalProductId
			  AND UPPER(sku) = UPPER(:sku)
			""", nativeQuery = true)
	Optional<Long> findIdByMarketplaceKey(
			@Param("storeId") Long storeId,
			@Param("marketplaceCode") String marketplaceCode,
			@Param("externalProductId") String externalProductId,
			@Param("sku") String sku);

	@Modifying(clearAutomatically = true)
	@Query(value = """
			UPDATE products
			SET sku = :sku,
			    name = :name,
			    price = :price,
			    currency = :currency,
			    status = :status,
			    is_enable = 1,
			    last_synced_at = :lastSyncedAt,
			    last_sync_run_id = :lastSyncRunId,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = :id
			""", nativeQuery = true)
	int updateMarketplaceListFields(
			@Param("id") Long id,
			@Param("sku") String sku,
			@Param("name") String name,
			@Param("price") java.math.BigDecimal price,
			@Param("currency") String currency,
			@Param("status") String status,
			@Param("lastSyncedAt") Instant lastSyncedAt,
			@Param("lastSyncRunId") Long lastSyncRunId);

	@Modifying(clearAutomatically = true)
	@Query(value = """
			UPDATE products
			SET description = :description,
			    images_json = :imagesJson,
			    variants_json = :variantsJson,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = :id
			""", nativeQuery = true)
	int updateMarketplaceDetailFields(
			@Param("id") Long id,
			@Param("description") String description,
			@Param("imagesJson") String imagesJson,
			@Param("variantsJson") String variantsJson);

	@Modifying(clearAutomatically = true)
	@Query(value = """
			UPDATE products
			SET is_enable = 0,
			    updated_at = CURRENT_TIMESTAMP
			WHERE store_id = :storeId
			  AND UPPER(marketplace_code) = UPPER(:marketplaceCode)
			  AND is_enable = 1
			  AND (last_synced_at IS NULL OR last_synced_at < :syncStartedAt)
			""", nativeQuery = true)
	int softDisableStaleMarketplaceProducts(
			@Param("storeId") Long storeId,
			@Param("marketplaceCode") String marketplaceCode,
			@Param("syncStartedAt") Instant syncStartedAt);
}
