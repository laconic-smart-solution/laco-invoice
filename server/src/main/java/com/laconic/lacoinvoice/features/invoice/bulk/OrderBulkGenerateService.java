package com.laconic.lacoinvoice.features.invoice.bulk;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.config.OrderBulkGenerateProperties;
import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateRun;
import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateStatus;
import com.laconic.lacoinvoice.domain.repositories.OrderBulkGenerateRunRepository;
import com.laconic.lacoinvoice.features.invoice.InvoiceService;
import com.laconic.lacoinvoice.features.order.OrderExportRequest;

@Service
public class OrderBulkGenerateService {

	private static final DateTimeFormatter EXPORT_DATE = DateTimeFormatter.BASIC_ISO_DATE;

	private final OrderBulkGenerateRunRepository runRepository;
	private final InvoiceService invoiceService;
	private final OrderBulkGenerateProperties properties;
	private final OrderBulkGenerateProgressPublisher progressPublisher;
	private final JobOperator jobOperator;
	private final Job orderBulkGenerateJob;

	public OrderBulkGenerateService(
			OrderBulkGenerateRunRepository runRepository,
			InvoiceService invoiceService,
			OrderBulkGenerateProperties properties,
			OrderBulkGenerateProgressPublisher progressPublisher,
			@Qualifier("orderBulkGenerateJobOperator") JobOperator jobOperator,
			@Qualifier("orderBulkGenerateJob") Job orderBulkGenerateJob) {
		this.runRepository = runRepository;
		this.invoiceService = invoiceService;
		this.properties = properties;
		this.progressPublisher = progressPublisher;
		this.jobOperator = jobOperator;
		this.orderBulkGenerateJob = orderBulkGenerateJob;
	}

	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderBulkGenerateRunDto start(OrderExportRequest request) {
		List<Long> orderIds = invoiceService.resolveOrderIdsForBulkGenerate(
				request,
				properties.getMaxOrders());
		if (orderIds.isEmpty()) {
			throw new BusinessRuleException("No orders found to generate invoices for.");
		}

		Long userId = AuditUserContext.getCurrentLocalUserId().orElse(null);
		if (userId != null
				&& runRepository.existsByTriggeredByAndStatus(userId, OrderBulkGenerateStatus.RUNNING)) {
			throw new ResourceConflictException("A bulk generate job is already running for your account.");
		}

		OrderBulkGenerateRun run = new OrderBulkGenerateRun();
		run.setStatus(OrderBulkGenerateStatus.RUNNING);
		run.setTotalCount(orderIds.size());
		run.setStartedAt(Instant.now());
		run.setTriggeredBy(userId);
		run.setOrderIdsJson(OrderBulkGenerateJsonSupport.toOrderIdsJson(orderIds));

		run = runRepository.save(run);

		Path workDir = Path.of(properties.getWorkRoot(), String.valueOf(run.getId()));
		try {
			Files.createDirectories(workDir);
		} catch (Exception ex) {
			run.setStatus(OrderBulkGenerateStatus.FAILED);
			run.setErrorMessage("Unable to create work directory.");
			run.setCompletedAt(Instant.now());
			runRepository.save(run);
			throw new IllegalStateException("Unable to create bulk generate work directory.", ex);
		}
		run.setWorkDir(workDir.toAbsolutePath().toString());
		run.setZipFilename(
				"orders-invoices-" + LocalDate.now().format(EXPORT_DATE) + "-" + run.getId() + ".zip");
		run = runRepository.save(run);
		progressPublisher.publish(toDto(run));

		JobParameters parameters = new JobParametersBuilder()
				.addLong("runId", run.getId())
				.addLong("runAt", System.currentTimeMillis())
				.toJobParameters();

		try {
			jobOperator.start(orderBulkGenerateJob, parameters);
		} catch (Exception ex) {
			run.setStatus(OrderBulkGenerateStatus.FAILED);
			run.setErrorMessage(ex.getMessage());
			run.setCompletedAt(Instant.now());
			runRepository.save(run);
			progressPublisher.publish(toDto(run));
			throw new IllegalStateException("Failed to start bulk generate job.", ex);
		}

		return toDto(run);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderBulkGenerateRunDto getRun(Long runId) {
		return toDto(requireRun(runId));
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public Resource downloadZip(Long runId) {
		OrderBulkGenerateRun run = requireRun(runId);
		if (run.getStatus() != OrderBulkGenerateStatus.COMPLETED
				|| !StringUtils.hasText(run.getZipPath())) {
			throw new BusinessRuleException("Bulk generate ZIP is not ready yet.");
		}
		Path zipPath = Path.of(run.getZipPath());
		if (!Files.isRegularFile(zipPath)) {
			throw new ResourceNotFoundException("ZIP file not found for run id=" + runId);
		}
		return new FileSystemResource(zipPath);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public String downloadFilename(Long runId) {
		OrderBulkGenerateRun run = requireRun(runId);
		if (StringUtils.hasText(run.getZipFilename())) {
			return run.getZipFilename();
		}
		return "orders-invoices-" + runId + ".zip";
	}

	private OrderBulkGenerateRun requireRun(Long runId) {
		return runRepository.findById(runId)
				.orElseThrow(() -> new ResourceNotFoundException("Bulk generate run not found: id=" + runId));
	}

	public static OrderBulkGenerateRunDto toDto(OrderBulkGenerateRun run) {
		return new OrderBulkGenerateRunDto(
				run.getId(),
				run.getStatus(),
				run.getTotalCount(),
				run.getProcessedCount(),
				run.getSuccessCount(),
				run.getFailedCount(),
				run.getZipFilename(),
				run.getErrorMessage(),
				run.getStartedAt(),
				run.getCompletedAt());
	}
}
