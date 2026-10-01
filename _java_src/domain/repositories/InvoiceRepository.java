package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.Invoice;

@Repository
public interface InvoiceRepository extends BaseRepository<Invoice> {

	Optional<Invoice> findByInvoiceNumberIgnoreCase(String invoiceNumber);

	boolean existsByInvoiceNumberIgnoreCase(String invoiceNumber);

	boolean existsByInvoiceNumberIgnoreCaseAndIdNot(String invoiceNumber, Long id);

	List<Invoice> findByInvoiceNumberStartingWithIgnoreCase(String prefix);
}
