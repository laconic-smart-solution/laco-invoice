package com.laconic.lacoinvoice.features.invoice.bulk;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@StepScope
public class OrderBulkGenerateItemWriter implements ItemWriter<OrderBulkGeneratePdfItem> {

	private final OrderBulkGenerateProgressService progressService;
	private final Long runId;

	public OrderBulkGenerateItemWriter(
			OrderBulkGenerateProgressService progressService,
			@Value("#{jobParameters['runId']}") Long runId) {
		this.progressService = progressService;
		this.runId = runId;
	}

	@Override
	public void write(Chunk<? extends OrderBulkGeneratePdfItem> chunk) {
		if (chunk == null || chunk.isEmpty()) {
			return;
		}
		progressService.recordSuccessBatch(runId, chunk.size());
	}
}
