package com.laconic.lacoinvoice.domain.repositories;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.VoucherOrderAllocation;

@Repository
public interface VoucherOrderAllocationRepository extends BaseRepository<VoucherOrderAllocation> {

	List<VoucherOrderAllocation> findByVoucher_IdOrderByIdAsc(Long voucherId);

	/** Rows of {orderId, totalAllocated} for the given orders, excluding voided vouchers. */
	@Query("""
			SELECT a.order.id, SUM(a.allocatedAmount) FROM VoucherOrderAllocation a
			WHERE a.order.id IN :orderIds
			AND a.voucher.status <> com.laconic.lacoinvoice.domain.models.VoucherStatus.VOID
			GROUP BY a.order.id
			""")
	List<Object[]> sumAllocatedByOrderIds(@Param("orderIds") Collection<Long> orderIds);

	@Query("""
			SELECT COALESCE(SUM(a.allocatedAmount), 0) FROM VoucherOrderAllocation a
			WHERE a.invoice.id = :invoiceId
			AND a.voucher.status <> com.laconic.lacoinvoice.domain.models.VoucherStatus.VOID
			""")
	BigDecimal sumAllocatedByInvoiceId(@Param("invoiceId") Long invoiceId);

	@Query("""
			SELECT COUNT(DISTINCT a.voucher.id) FROM VoucherOrderAllocation a
			WHERE a.invoice.id = :invoiceId
			AND a.voucher.status <> com.laconic.lacoinvoice.domain.models.VoucherStatus.VOID
			""")
	long countVouchersByInvoiceId(@Param("invoiceId") Long invoiceId);
}
