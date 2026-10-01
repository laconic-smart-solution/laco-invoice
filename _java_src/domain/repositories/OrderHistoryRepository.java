package com.laconic.lacoinvoice.domain.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.domain.models.OrderHistory;

@Repository
public interface OrderHistoryRepository extends JpaRepository<OrderHistory, Long> {

	Page<OrderHistory> findByOrder_IdOrderByPerformedAtDescIdDesc(Long orderId, Pageable pageable);

	long countByOrder_Id(Long orderId);
}
