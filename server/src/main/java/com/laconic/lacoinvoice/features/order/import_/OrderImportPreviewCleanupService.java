package com.laconic.lacoinvoice.features.order.import_;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.config.OrderImportPreviewCleanupQuartzProperties;
import com.laconic.lacoinvoice.domain.repositories.OrderImportBatchRepository;

@Service
public class OrderImportPreviewCleanupService {

	private static final Logger log = LoggerFactory.getLogger(OrderImportPreviewCleanupService.class);

	private final OrderImportBatchRepository batchRepository;
	private final OrderImportPreviewCleanupQuartzProperties properties;

	public OrderImportPreviewCleanupService(
			OrderImportBatchRepository batchRepository,
			OrderImportPreviewCleanupQuartzProperties properties) {
		this.batchRepository = batchRepository;
		this.properties = properties;
	}

	@Transactional
	public CleanupResult purgeExpiredStaging() {
		return purgeExpiredStaging(properties.getRetentionDays());
	}

	/**
	 * 1) Mark stale {@code PREVIEW} batches as {@code EXPIRED}.
	 * 2) Hard-delete staging rows for {@code COMMITTED}/{@code EXPIRED}/{@code CANCELLED}
	 *    batches older than {@code retentionDays}.
	 * <p>
	 * Never deletes {@code order_import_files}, {@code lco_orders}, or {@code order_items}.
	 */
	@Transactional
	public CleanupResult purgeExpiredStaging(int retentionDays) {
		int safeRetentionDays = Math.max(1, retentionDays);
		Instant now = Instant.now();
		Instant cutoff = now.minus(safeRetentionDays, ChronoUnit.DAYS);

		int expiredBatches = batchRepository.expireStalePreviewBatches(now);
		int deletedItems = batchRepository.deletePreviewItemsForPurgeableBatches(cutoff);
		int deletedOrders = batchRepository.deletePreviewOrdersForPurgeableBatches(cutoff);
		int deletedBatches = batchRepository.deletePurgeableBatches(cutoff);

		if (expiredBatches > 0 || deletedBatches > 0) {
			log.info(
					"Import preview staging purge: expiredBatches={}, deletedItems={}, deletedOrders={}, deletedBatches={}, cutoff={}",
					expiredBatches,
					deletedItems,
					deletedOrders,
					deletedBatches,
					cutoff);
		}

		return new CleanupResult(expiredBatches, deletedItems, deletedOrders, deletedBatches);
	}

	public record CleanupResult(int expiredBatches, int deletedItems, int deletedOrders, int deletedBatches) {
	}
}
