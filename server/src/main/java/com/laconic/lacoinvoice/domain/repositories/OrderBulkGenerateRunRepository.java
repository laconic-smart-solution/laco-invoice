package com.laconic.lacoinvoice.domain.repositories;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateRun;
import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateStatus;

@Repository
public interface OrderBulkGenerateRunRepository extends BaseRepository<OrderBulkGenerateRun> {

	boolean existsByTriggeredByAndStatus(Long triggeredBy, OrderBulkGenerateStatus status);

	@Modifying
	@Query(value = """
			UPDATE order_bulk_generate_runs
			SET processed_count = processed_count + :processedDelta,
			    success_count = success_count + :successDelta,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = :runId
			""", nativeQuery = true)
	int incrementProgress(
			@Param("runId") Long runId,
			@Param("processedDelta") int processedDelta,
			@Param("successDelta") int successDelta);

	@Modifying
	@Query(value = """
			UPDATE order_bulk_generate_runs
			SET failed_count = failed_count + :delta,
			    processed_count = processed_count + :delta,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = :runId
			""", nativeQuery = true)
	int incrementFailed(@Param("runId") Long runId, @Param("delta") int delta);
}
