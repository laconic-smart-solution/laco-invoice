package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.PaymentVoucher;

@Repository
public interface PaymentVoucherRepository extends BaseRepository<PaymentVoucher> {

	boolean existsByVoucherNumberIgnoreCase(String voucherNumber);

	boolean existsByVoucherNumberIgnoreCaseAndIdNot(String voucherNumber, Long id);

	List<PaymentVoucher> findByVoucherNumberStartingWithIgnoreCase(String prefix);

	@Query("""
			SELECT DISTINCT a.voucher FROM VoucherOrderAllocation a
			WHERE a.invoice.id = :invoiceId
			ORDER BY a.voucher.voucherDate DESC, a.voucher.id DESC
			""")
	List<PaymentVoucher> findByInvoiceId(@Param("invoiceId") Long invoiceId);
}
