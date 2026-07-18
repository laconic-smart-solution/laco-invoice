package com.laconic.lacoinvoice.domain.repositories;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderItem;

@Repository
public interface OrderItemRepository extends BaseRepository<OrderItem> {

	void deleteByOrder_Id(Long orderId);
}
