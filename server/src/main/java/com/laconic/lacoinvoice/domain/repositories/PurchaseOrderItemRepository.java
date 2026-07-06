package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.PurchaseOrderItem;

@Repository
public interface PurchaseOrderItemRepository extends BaseRepository<PurchaseOrderItem> {

	List<PurchaseOrderItem> findByPurchaseOrder_Id(Long purchaseOrderId);

	void deleteByPurchaseOrder_Id(Long purchaseOrderId);
}
