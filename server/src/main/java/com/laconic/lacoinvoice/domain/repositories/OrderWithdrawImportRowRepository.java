package com.laconic.lacoinvoice.domain.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderWithdrawApplyStatus;
import com.laconic.lacoinvoice.domain.models.OrderWithdrawImportRow;
import com.laconic.lacoinvoice.domain.models.OrderWithdrawMatchStatus;

@Repository
public interface OrderWithdrawImportRowRepository extends BaseRepository<OrderWithdrawImportRow> {

	Page<OrderWithdrawImportRow> findByOrderInputRun_IdOrderByExcelRowIndexAscIdAsc(
			Long orderInputRunId,
			Pageable pageable);

	@Query(
			value = """
					SELECT r FROM OrderWithdrawImportRow r
					WHERE r.orderInputRun.id = :runId
					  AND (:externalOrderId IS NULL
					       OR LOWER(r.externalOrderId) LIKE LOWER(CONCAT('%', :externalOrderId, '%')))
					  AND (:matchStatus IS NULL OR r.matchStatus = :matchStatus)
					  AND (:applyStatus IS NULL OR r.applyStatus = :applyStatus)
					""",
			countQuery = """
					SELECT COUNT(r) FROM OrderWithdrawImportRow r
					WHERE r.orderInputRun.id = :runId
					  AND (:externalOrderId IS NULL
					       OR LOWER(r.externalOrderId) LIKE LOWER(CONCAT('%', :externalOrderId, '%')))
					  AND (:matchStatus IS NULL OR r.matchStatus = :matchStatus)
					  AND (:applyStatus IS NULL OR r.applyStatus = :applyStatus)
					""")
	Page<OrderWithdrawImportRow> findFilteredByRunId(
			@Param("runId") Long runId,
			@Param("externalOrderId") String externalOrderId,
			@Param("matchStatus") OrderWithdrawMatchStatus matchStatus,
			@Param("applyStatus") OrderWithdrawApplyStatus applyStatus,
			Pageable pageable);

	@Modifying(clearAutomatically = true)
	@Query(value = "DELETE FROM order_withdraw_import_rows WHERE order_input_run_id = :runId", nativeQuery = true)
	int deleteByOrderInputRunId(@Param("runId") Long runId);

	/**
	 * Sums payout money columns for optional store scope.
	 * Returns one row: [totalRevenue, totalFees, totalAdjustments].
	 */
	@Query("""
			SELECT COALESCE(SUM(r.totalRevenue), 0),
			       COALESCE(SUM(r.totalFees), 0),
			       COALESCE(SUM(COALESCE(r.affiliateShopAdsCommission, 0) + COALESCE(r.affiliatePartnerShopAdsCommission, 0)), 0)
			FROM OrderWithdrawImportRow r
			WHERE (:storeId IS NULL OR r.orderInputRun.store.id = :storeId)
			""")
	List<Object[]> sumMoneyByOptionalStoreId(@Param("storeId") Long storeId);

	/**
	 * Fees/adjustments per order, matched by linked order id or by external order id
	 * within the same store + marketplace (covers unmatched rows that still share an ID).
	 * Returns: [orderId, totalFees, totalAdjustments].
	 */
	@Query("""
			SELECT o.id,
			       COALESCE(SUM(r.totalFees), 0),
			       COALESCE(SUM(COALESCE(r.affiliateShopAdsCommission, 0) + COALESCE(r.affiliatePartnerShopAdsCommission, 0)), 0)
			FROM OrderWithdrawImportRow r, Order o
			WHERE o.id IN :orderIds
			  AND r.externalOrderId = o.externalOrderId
			  AND r.orderInputRun.store.id = o.store.id
			GROUP BY o.id
			""")
	List<Object[]> sumMoneyByOrderIds(@Param("orderIds") Collection<Long> orderIds);
}
