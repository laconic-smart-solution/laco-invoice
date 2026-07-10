package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.domain.repositories.MarketplaceProductSyncRunRepository;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductPersistenceService.UpsertBatchResult;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductSyncService;

@Service
public class MarketplaceProductSyncProgressService {

	private final MarketplaceProductSyncRunRepository syncRunRepository;
	private final MarketplaceProductSyncProgressPublisher progressPublisher;

	public MarketplaceProductSyncProgressService(
			MarketplaceProductSyncRunRepository syncRunRepository,
			MarketplaceProductSyncProgressPublisher progressPublisher) {
		this.syncRunRepository = syncRunRepository;
		this.progressPublisher = progressPublisher;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void recordUpsertBatch(Long syncRunId, UpsertBatchResult batch) {
		if (syncRunId == null || batch == null) {
			return;
		}
		if (batch.inserted() > 0) {
			syncRunRepository.incrementInserted(syncRunId, batch.inserted());
		}
		if (batch.updated() > 0) {
			syncRunRepository.incrementUpdated(syncRunId, batch.updated());
		}
		publishProgress(syncRunId);
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void incrementFailed(Long syncRunId) {
		if (syncRunId == null) {
			return;
		}
		syncRunRepository.incrementFailed(syncRunId, 1);
		publishProgress(syncRunId);
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void setDisabledCount(Long syncRunId, int disabledCount) {
		if (syncRunId == null) {
			return;
		}
		syncRunRepository.setDisabledCount(syncRunId, disabledCount);
		publishProgress(syncRunId);
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
	public void publishProgress(Long syncRunId) {
		if (syncRunId == null) {
			return;
		}
		syncRunRepository.findById(syncRunId)
				.ifPresent(run -> progressPublisher.publish(MarketplaceProductSyncService.toDto(run)));
	}
}
