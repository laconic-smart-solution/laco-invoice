package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderItem;

@Repository
public interface OrderRepository extends BaseRepository<Order> {

	Optional<Order> findByStore_IdAndMarketplace_IdAndExternalOrderId(
			Long storeId,
			Long marketplaceId,
			String externalOrderId);

	@Query("""
			SELECT DISTINCT o FROM Order o
			LEFT JOIN FETCH o.customer
			LEFT JOIN FETCH o.marketplace
			LEFT JOIN FETCH o.store
			WHERE o.id = :id
			""")
	Optional<Order> findDetailById(@Param("id") Long id);

	@Query("""
			SELECT oi FROM OrderItem oi
			LEFT JOIN FETCH oi.product
			WHERE oi.order.id = :orderId
			""")
	List<OrderItem> findItemsByOrderId(@Param("orderId") Long orderId);
}
