package com.laconic.lacoinvoice.features.invoice.bulk;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.domain.repositories.OrderBulkGenerateRunRepository;

@Service
public class OrderBulkGenerateProgressService {

	private final OrderBulkGenerateRunRepository runRepository;
	private final OrderBulkGenerateProgressPublisher progressPublisher;

	public OrderBulkGenerateProgressService(
			OrderBulkGenerateRunRepository runRepository,
			OrderBulkGenerateProgressPublisher progressPublisher) {
		this.runRepository = runRepository;
		this.progressPublisher = progressPublisher;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void recordSuccessBatch(Long runId, int count) {
		if (runId == null || count <= 0) {
			return;
		}
		runRepository.incrementProgress(runId, count, count);
		publishProgress(runId);
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void incrementFailed(Long runId) {
		if (runId == null) {
			return;
		}
		runRepository.incrementFailed(runId, 1);
		publishProgress(runId);
	}

	@Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
	public void publishProgress(Long runId) {
		runRepository.findById(runId).ifPresent(run -> progressPublisher.publish(OrderBulkGenerateService.toDto(run)));
	}
}
