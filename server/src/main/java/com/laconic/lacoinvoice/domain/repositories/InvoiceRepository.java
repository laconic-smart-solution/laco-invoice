package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.Invoice;

@Repository
public interface InvoiceRepository extends BaseRepository<Invoice> {

	Optional<Invoice> findByOrder_Id(Long orderId);

	boolean existsByOrder_Id(Long orderId);

	Optional<Invoice> findTopByInvoiceNoStartingWithOrderByInvoiceNoDesc(String prefix);

	@Query("""
			SELECT i FROM Invoice i
			LEFT JOIN FETCH i.order o
			LEFT JOIN FETCH o.store
			WHERE i.id = :id
			""")
	Optional<Invoice> findDetailById(@Param("id") Long id);
}
