package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderInputRun;

@Repository
public interface OrderInputRunRepository extends BaseRepository<OrderInputRun> {

	Optional<OrderInputRun> findByIdAndStore_Id(Long id, Long storeId);

	Page<OrderInputRun> findByStore_IdOrderByCreatedAtDesc(Long storeId, Pageable pageable);
}
