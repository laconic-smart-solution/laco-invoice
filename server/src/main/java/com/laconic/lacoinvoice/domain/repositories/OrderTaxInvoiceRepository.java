package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderTaxInvoice;

@Repository
public interface OrderTaxInvoiceRepository extends BaseRepository<OrderTaxInvoice> {

	Optional<OrderTaxInvoice> findByOrder_Id(Long orderId);
}
