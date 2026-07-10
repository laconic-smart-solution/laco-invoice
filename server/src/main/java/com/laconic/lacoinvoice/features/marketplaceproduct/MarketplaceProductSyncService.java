package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.time.Instant;

import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncRun;
import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncStatus;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceProductSyncRunRepository;

@Service
public class MarketplaceProductSyncService {

	private final MarketplaceProductSyncRunRepository syncRunRepository;
	private final JobOperator jobOperator;
	private final Job marketplaceProductSyncJob;

	public MarketplaceProductSyncService(
			MarketplaceProductSyncRunRepository syncRunRepository,
			@Qualifier("asyncJobOperator") JobOperator jobOperator,
			@Qualifier("marketplaceProductSyncJob") Job marketplaceProductSyncJob) {
		this.syncRunRepository = syncRunRepository;
		this.jobOperator = jobOperator;
		this.marketplaceProductSyncJob = marketplaceProductSyncJob;
	}

	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public MarketplaceProductSyncRunDto startSync(Long storeId, String marketplaceCode) {
		String normalizedCode = marketplaceCode != null ? marketplaceCode.trim().toUpperCase() : "";
		if (storeId == null || normalizedCode.isBlank()) {
			throw new IllegalArgumentException("storeId and marketplaceCode are required.");
		}
		if (syncRunRepository.existsByStoreIdAndMarketplaceCodeIgnoreCaseAndStatus(
				storeId,
				normalizedCode,
				MarketplaceProductSyncStatus.RUNNING)) {
			throw new ResourceConflictException("A product sync is already running for this store source.");
		}

		MarketplaceProductSyncRun run = new MarketplaceProductSyncRun();
		run.setStoreId(storeId);
		run.setMarketplaceCode(normalizedCode);
		run.setStatus(MarketplaceProductSyncStatus.RUNNING);
		run.setStartedAt(Instant.now());
		AuditUserContext.getCurrentLocalUserId().ifPresent(run::setTriggeredBy);
		run = syncRunRepository.save(run);

		JobParameters parameters = new JobParametersBuilder()
				.addLong("syncRunId", run.getId())
				.addLong("storeId", storeId)
				.addString("marketplaceCode", normalizedCode)
				.addString("syncStartedAt", run.getStartedAt().toString())
				.addLong("runAt", System.currentTimeMillis())
				.toJobParameters();

		try {
			jobOperator.start(marketplaceProductSyncJob, parameters);
		} catch (Exception ex) {
			run.setStatus(MarketplaceProductSyncStatus.FAILED);
			run.setErrorMessage(ex.getMessage());
			run.setCompletedAt(Instant.now());
			syncRunRepository.save(run);
			throw new IllegalStateException("Failed to start product sync job.", ex);
		}
		return toDto(run);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public MarketplaceProductSyncRunDto getSyncRun(Long syncRunId) {
		MarketplaceProductSyncRun run = syncRunRepository.findById(syncRunId)
				.orElseThrow(() -> new ResourceNotFoundException("Sync run not found: id=" + syncRunId));
		return toDto(run);
	}

	static MarketplaceProductSyncRunDto toDto(MarketplaceProductSyncRun run) {
		return new MarketplaceProductSyncRunDto(
				run.getId(),
				run.getStoreId(),
				run.getMarketplaceCode(),
				run.getStatus(),
				run.getInsertedCount(),
				run.getUpdatedCount(),
				run.getDisabledCount(),
				run.getFailedCount(),
				run.getErrorMessage(),
				run.getStartedAt(),
				run.getCompletedAt());
	}
}
