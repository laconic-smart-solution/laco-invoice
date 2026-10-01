package com.laconic.lacoinvoice.domain.repositories;

import java.time.Instant;
import java.util.Collection;
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

	List<Order> findByStore_IdAndMarketplace_IdAndExternalOrderIdIn(
			Long storeId,
			Long marketplaceId,
			Collection<String> externalOrderIds);

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

	@Query("""
			SELECT COUNT(o) FROM Order o
			WHERE (:storeId IS NULL OR o.store.id = :storeId)
			""")
	long countByOptionalStoreId(@Param("storeId") Long storeId);

	/** Billable orders of a store/marketplace whose order date falls in [from, to). */
	@Query("""
			SELECT o FROM Order o
			LEFT JOIN FETCH o.customer
			WHERE o.store.id = :storeId
			AND o.marketplace.id = :marketplaceId
			AND o.orderDate >= :from
			AND o.orderDate < :to
			ORDER BY o.orderDate ASC, o.id ASC
			""")
	List<Order> findBillableByPeriod(
			@Param("storeId") Long storeId,
			@Param("marketplaceId") Long marketplaceId,
			@Param("from") Instant from,
			@Param("to") Instant to);

	/** Billable orders imported by a specific Excel import file. */
	@Query("""
			SELECT o FROM Order o
			LEFT JOIN FETCH o.customer
			WHERE o.store.id = :storeId
			AND o.marketplace.id = :marketplaceId
			AND o.sourceType = com.laconic.lacoinvoice.domain.models.OrderSourceType.IMPORT
			AND o.sourceId = :importFileId
			ORDER BY o.orderDate ASC, o.id ASC
			""")
	List<Order> findBillableByImportFile(
			@Param("storeId") Long storeId,
			@Param("marketplaceId") Long marketplaceId,
			@Param("importFileId") Long importFileId);

	@Query("""
			SELECT oi FROM OrderItem oi
			LEFT JOIN FETCH oi.product
			WHERE oi.order.id IN :orderIds
			ORDER BY oi.order.id ASC, oi.id ASC
			""")
	List<OrderItem> findItemsByOrderIds(@Param("orderIds") Collection<Long> orderIds);
}
