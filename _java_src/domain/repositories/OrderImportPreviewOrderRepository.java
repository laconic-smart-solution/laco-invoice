package com.laconic.lacoinvoice.domain.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderImportMatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderImportPreviewOrder;

@Repository
public interface OrderImportPreviewOrderRepository extends BaseRepository<OrderImportPreviewOrder> {

	List<OrderImportPreviewOrder> findByBatch_IdOrderByIdAsc(Long batchId);

	List<OrderImportPreviewOrder> findByBatch_IdAndIdIn(Long batchId, Collection<Long> ids);

	List<OrderImportPreviewOrder> findByBatch_IdAndMatchStatus(Long batchId, OrderImportMatchStatus matchStatus);

	Optional<OrderImportPreviewOrder> findByIdAndBatch_Id(Long id, Long batchId);

	long countByBatch_IdAndMatchStatus(Long batchId, OrderImportMatchStatus matchStatus);
}
