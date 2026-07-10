package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import java.time.Instant;

import org.springframework.batch.core.step.StepContribution;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.infrastructure.repeat.RepeatStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductPersistenceService;

@Component
@StepScope
public class MarketplaceProductSoftDisableTasklet implements Tasklet {

	private final MarketplaceProductPersistenceService persistenceService;
	private final MarketplaceProductSyncProgressService progressService;

	@Value("#{jobParameters['storeId']}")
	private Long storeId;

	@Value("#{jobParameters['marketplaceCode']}")
	private String marketplaceCode;

	@Value("#{jobParameters['syncStartedAt']}")
	private String syncStartedAt;

	@Value("#{jobParameters['syncRunId']}")
	private Long syncRunId;

	public MarketplaceProductSoftDisableTasklet(
			MarketplaceProductPersistenceService persistenceService,
			MarketplaceProductSyncProgressService progressService) {
		this.persistenceService = persistenceService;
		this.progressService = progressService;
	}

	@Override
	public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) {
		int disabled = persistenceService.softDisableStale(
				storeId,
				marketplaceCode,
				Instant.parse(syncStartedAt));
		progressService.setDisabledCount(syncRunId, disabled);
		return RepeatStatus.FINISHED;
	}
}
