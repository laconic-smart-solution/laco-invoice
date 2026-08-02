package com.laconic.lacoinvoice.features.invoice.bulk;

import java.time.Instant;

import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.listener.JobExecutionListener;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateRun;
import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateStatus;
import com.laconic.lacoinvoice.domain.repositories.OrderBulkGenerateRunRepository;

@Component
public class OrderBulkGenerateJobListener implements JobExecutionListener {

	private final OrderBulkGenerateRunRepository runRepository;
	private final OrderBulkGenerateProgressPublisher progressPublisher;

	public OrderBulkGenerateJobListener(
			OrderBulkGenerateRunRepository runRepository,
			OrderBulkGenerateProgressPublisher progressPublisher) {
		this.runRepository = runRepository;
		this.progressPublisher = progressPublisher;
	}

	@Override
	public void afterJob(JobExecution jobExecution) {
		Long runId = jobExecution.getJobParameters().getLong("runId");
		if (runId == null) {
			return;
		}
		OrderBulkGenerateRun run = runRepository.findById(runId).orElse(null);
		if (run == null) {
			return;
		}
		run.setCompletedAt(Instant.now());
		boolean hasZip = run.getZipPath() != null && !run.getZipPath().isBlank();
		if (jobExecution.getStatus() == BatchStatus.COMPLETED && hasZip && run.getSuccessCount() > 0) {
			run.setStatus(OrderBulkGenerateStatus.COMPLETED);
		} else {
			run.setStatus(OrderBulkGenerateStatus.FAILED);
			if (run.getErrorMessage() == null
					&& jobExecution.getAllFailureExceptions() != null
					&& !jobExecution.getAllFailureExceptions().isEmpty()) {
				run.setErrorMessage(jobExecution.getAllFailureExceptions().getFirst().getMessage());
			} else if (run.getErrorMessage() == null && run.getSuccessCount() <= 0) {
				run.setErrorMessage("No invoice PDFs were generated.");
			} else if (run.getErrorMessage() == null && !hasZip) {
				run.setErrorMessage("Bulk generate finished without a ZIP file.");
			}
		}
		runRepository.save(run);
		progressPublisher.publish(OrderBulkGenerateService.toDto(run));
	}
}
