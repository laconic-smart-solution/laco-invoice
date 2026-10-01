package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderItem;

@Repository
public interface OrderItemRepository extends BaseRepository<OrderItem> {

	void deleteByOrder_Id(Long orderId);

	List<OrderItem> findByOrder_Id(Long orderId);

	long countByOrder_Id(Long orderId);
}
