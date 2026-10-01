package com.laconic.lacoinvoice.domain.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.domain.models.OrderHistoryChange;

@Repository
public interface OrderHistoryChangeRepository extends JpaRepository<OrderHistoryChange, Long> {

	List<OrderHistoryChange> findByHistory_IdInOrderByIdAsc(Collection<Long> historyIds);
}
