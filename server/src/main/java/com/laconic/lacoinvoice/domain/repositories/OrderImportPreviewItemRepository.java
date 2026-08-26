package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderImportPreviewItem;

@Repository
public interface OrderImportPreviewItemRepository extends BaseRepository<OrderImportPreviewItem> {

	List<OrderImportPreviewItem> findByPreviewOrder_IdOrderByIdAsc(Long previewOrderId);

	List<OrderImportPreviewItem> findByPreviewOrder_IdOrderByExcelRowIndexAscIdAsc(Long previewOrderId);

	List<OrderImportPreviewItem> findByPreviewOrder_Batch_Id(Long batchId);
}
