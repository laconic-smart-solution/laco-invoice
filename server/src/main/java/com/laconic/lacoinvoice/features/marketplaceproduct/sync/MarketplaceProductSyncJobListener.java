package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import java.time.Instant;

import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.listener.JobExecutionListener;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncRun;
import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncStatus;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceProductSyncRunRepository;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductSyncService;

@Component
public class MarketplaceProductSyncJobListener implements JobExecutionListener {

	private final MarketplaceProductSyncRunRepository syncRunRepository;
	private final MarketplaceProductSyncProgressPublisher progressPublisher;

	public MarketplaceProductSyncJobListener(
			MarketplaceProductSyncRunRepository syncRunRepository,
			MarketplaceProductSyncProgressPublisher progressPublisher) {
		this.syncRunRepository = syncRunRepository;
		this.progressPublisher = progressPublisher;
	}

	@Override
	public void afterJob(JobExecution jobExecution) {
		Long syncRunId = jobExecution.getJobParameters().getLong("syncRunId");
		if (syncRunId == null) {
			return;
		}
		MarketplaceProductSyncRun run = syncRunRepository.findById(syncRunId).orElse(null);
		if (run == null) {
			return;
		}
		run.setCompletedAt(Instant.now());
		if (jobExecution.getStatus() == BatchStatus.COMPLETED) {
			run.setStatus(MarketplaceProductSyncStatus.COMPLETED);
		} else {
			run.setStatus(MarketplaceProductSyncStatus.FAILED);
			if (jobExecution.getAllFailureExceptions() != null && !jobExecution.getAllFailureExceptions().isEmpty()) {
				run.setErrorMessage(jobExecution.getAllFailureExceptions().getFirst().getMessage());
			}
		}
		syncRunRepository.save(run);
		progressPublisher.publish(MarketplaceProductSyncService.toDto(run));
	}
}
