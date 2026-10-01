package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherEntry;

@Repository
public interface ErpGlVoucherEntryRepository extends BaseRepository<ErpGlVoucherEntry> {

	List<ErpGlVoucherEntry> findByVoucher_IdOrderByIdAsc(Long voucherId);
}
