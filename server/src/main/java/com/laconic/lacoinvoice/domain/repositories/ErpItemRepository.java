package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.ErpItem;

@Repository
public interface ErpItemRepository extends BaseRepository<ErpItem> {

	Optional<ErpItem> findByErpCodeIgnoreCase(String erpCode);

	boolean existsByErpCodeIgnoreCase(String erpCode);

	boolean existsByErpCodeIgnoreCaseAndIdNot(String erpCode, Long id);
}
