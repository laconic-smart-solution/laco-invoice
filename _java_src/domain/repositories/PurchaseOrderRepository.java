package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.PurchaseOrder;

@Repository
public interface PurchaseOrderRepository extends BaseRepository<PurchaseOrder> {

	Optional<PurchaseOrder> findByPoNumberIgnoreCase(String poNumber);

	boolean existsByPoNumberIgnoreCase(String poNumber);

	boolean existsByPoNumberIgnoreCaseAndIdNot(String poNumber, Long id);
}
