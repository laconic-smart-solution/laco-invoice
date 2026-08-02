package com.laconic.lacoinvoice.features.invoice.bulk;

import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.ItemReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateRun;
import com.laconic.lacoinvoice.domain.repositories.OrderBulkGenerateRunRepository;

@Component
@StepScope
public class OrderBulkGenerateItemReader implements ItemReader<Long> {

	private final OrderBulkGenerateRunRepository runRepository;
	private final Long runId;

	private Iterator<Long> iterator;

	public OrderBulkGenerateItemReader(
			OrderBulkGenerateRunRepository runRepository,
			@Value("#{jobParameters['runId']}") Long runId) {
		this.runRepository = runRepository;
		this.runId = runId;
	}

	@Override
	public Long read() throws Exception {
		if (iterator == null) {
			iterator = loadOrderIds().iterator();
		}
		return iterator.hasNext() ? iterator.next() : null;
	}

	private List<Long> loadOrderIds() {
		OrderBulkGenerateRun run = runRepository.findById(runId).orElse(null);
		if (run == null || run.getOrderIdsJson() == null || run.getOrderIdsJson().isBlank()) {
			return Collections.emptyList();
		}
		return OrderBulkGenerateJsonSupport.parseOrderIds(run.getOrderIdsJson());
	}
}
