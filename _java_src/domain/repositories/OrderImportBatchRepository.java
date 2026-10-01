package com.laconic.lacoinvoice.domain.repositories;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderImportBatch;

@Repository
public interface OrderImportBatchRepository extends BaseRepository<OrderImportBatch> {

	Optional<OrderImportBatch> findByIdAndStore_Id(Long id, Long storeId);

	@Modifying(clearAutomatically = true)
	@Query(value = """
			UPDATE order_import_batches
			SET status = 'EXPIRED',
			    updated_at = :now
			WHERE status = 'PREVIEW'
			  AND expires_at < :now
			""", nativeQuery = true)
	int expireStalePreviewBatches(@Param("now") Instant now);

	@Modifying(clearAutomatically = true)
	@Query(value = """
			DELETE FROM order_import_preview_items
			WHERE preview_order_id IN (
			  SELECT o.id
			  FROM order_import_preview_orders o
			  WHERE o.batch_id IN (
			    SELECT b.id
			    FROM order_import_batches b
			    WHERE b.status IN ('COMMITTED', 'EXPIRED', 'CANCELLED')
			      AND COALESCE(b.committed_at, b.expires_at, b.created_at) < :cutoff
			  )
			)
			""", nativeQuery = true)
	int deletePreviewItemsForPurgeableBatches(@Param("cutoff") Instant cutoff);

	@Modifying(clearAutomatically = true)
	@Query(value = """
			DELETE FROM order_import_preview_orders
			WHERE batch_id IN (
			  SELECT b.id
			  FROM order_import_batches b
			  WHERE b.status IN ('COMMITTED', 'EXPIRED', 'CANCELLED')
			    AND COALESCE(b.committed_at, b.expires_at, b.created_at) < :cutoff
			)
			""", nativeQuery = true)
	int deletePreviewOrdersForPurgeableBatches(@Param("cutoff") Instant cutoff);

	@Modifying(clearAutomatically = true)
	@Query(value = """
			DELETE FROM order_import_batches
			WHERE id IN (
			  SELECT id FROM (
			    SELECT b.id AS id
			    FROM order_import_batches b
			    WHERE b.status IN ('COMMITTED', 'EXPIRED', 'CANCELLED')
			      AND COALESCE(b.committed_at, b.expires_at, b.created_at) < :cutoff
			  ) purgeable
			)
			""", nativeQuery = true)
	int deletePurgeableBatches(@Param("cutoff") Instant cutoff);
}
