package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.InvoiceItem;

@Repository
public interface InvoiceItemRepository extends BaseRepository<InvoiceItem> {

	List<InvoiceItem> findByInvoice_IdOrderByOrderDateAscIdAsc(Long invoiceId);
}
