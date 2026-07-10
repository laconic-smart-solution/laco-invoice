package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.batch.core.configuration.annotation.JobScope;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncRun;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceProductSyncRunRepository;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductPersistenceService.UpsertBatchResult;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductPersistenceService.UpsertResult;

@Component
@JobScope
public class MarketplaceProductSyncRunContext {

	private final MarketplaceProductSyncRunRepository syncRunRepository;
	private MarketplaceProductSyncRun run;

	public MarketplaceProductSyncRunContext(MarketplaceProductSyncRunRepository syncRunRepository) {
		this.syncRunRepository = syncRunRepository;
	}

	public void initialize(Long syncRunId) {
		this.run = syncRunRepository.findById(syncRunId)
				.orElseThrow(() -> new IllegalStateException("Sync run not found: id=" + syncRunId));
	}

	public MarketplaceProductSyncRun run() {
		return run;
	}

	public void recordUpsert(UpsertResult result) {
		if (run == null || result == null) {
			return;
		}
		switch (result) {
			case INSERTED -> run.setInsertedCount(run.getInsertedCount() + 1);
			case UPDATED -> run.setUpdatedCount(run.getUpdatedCount() + 1);
			case SKIPPED -> {
				// no-op
			}
		}
	}

	public void recordUpsertBatch(UpsertBatchResult batch) {
		if (run == null || batch == null) {
			return;
		}
		run.setInsertedCount(run.getInsertedCount() + batch.inserted());
		run.setUpdatedCount(run.getUpdatedCount() + batch.updated());
	}

	public void recordFailure() {
		if (run != null) {
			run.setFailedCount(run.getFailedCount() + 1);
		}
	}

	public void setDisabledCount(int disabledCount) {
		if (run != null) {
			run.setDisabledCount(disabledCount);
		}
	}

	public void save() {
		if (run != null) {
			syncRunRepository.save(run);
		}
	}
}
