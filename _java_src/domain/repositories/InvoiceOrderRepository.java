package com.laconic.lacoinvoice.domain.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.InvoiceOrder;

@Repository
public interface InvoiceOrderRepository extends BaseRepository<InvoiceOrder> {

	List<InvoiceOrder> findByInvoice_IdOrderByOrderDateAscIdAsc(Long invoiceId);

	/** Order ids already billed on an invoice that has not been voided. */
	@Query("""
			SELECT io.order.id FROM InvoiceOrder io
			WHERE io.order.id IN :orderIds
			AND io.invoice.status <> com.laconic.lacoinvoice.domain.models.InvoiceStatus.VOID
			""")
	List<Long> findAlreadyBilledOrderIds(@Param("orderIds") Collection<Long> orderIds);
}
