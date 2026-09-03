package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;

@Repository
public interface ErpGlVoucherRepository extends BaseRepository<ErpGlVoucher> {

	List<ErpGlVoucher> findByInvoice_IdOrderByIdDesc(Long invoiceId);

	List<ErpGlVoucher> findByVoucherNumberStartingWithIgnoreCase(String prefix);

	boolean existsByVoucherNumberIgnoreCase(String voucherNumber);
}
