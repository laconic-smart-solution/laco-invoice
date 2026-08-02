package com.laconic.lacoinvoice.features.invoice.bulk;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.batch.core.step.StepContribution;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.infrastructure.repeat.RepeatStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.domain.models.OrderBulkGenerateRun;
import com.laconic.lacoinvoice.domain.repositories.OrderBulkGenerateRunRepository;

@Component
@StepScope
public class OrderBulkGenerateZipTasklet implements Tasklet {

	private static final DateTimeFormatter EXPORT_DATE = DateTimeFormatter.BASIC_ISO_DATE;

	private final OrderBulkGenerateRunRepository runRepository;
	private final OrderBulkGenerateProgressPublisher progressPublisher;
	private final Long runId;

	public OrderBulkGenerateZipTasklet(
			OrderBulkGenerateRunRepository runRepository,
			OrderBulkGenerateProgressPublisher progressPublisher,
			@Value("#{jobParameters['runId']}") Long runId) {
		this.runRepository = runRepository;
		this.progressPublisher = progressPublisher;
		this.runId = runId;
	}

	@Override
	public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
		OrderBulkGenerateRun run = runRepository.findById(runId)
				.orElseThrow(() -> new BusinessRuleException("Bulk generate run not found: id=" + runId));

		Path workDir = Path.of(run.getWorkDir());
		if (!Files.isDirectory(workDir)) {
			throw new BusinessRuleException("Bulk generate work directory is missing.");
		}

		String zipFilename = "orders-invoices-" + LocalDate.now().format(EXPORT_DATE) + "-" + runId + ".zip";
		Path zipPath = workDir.resolve(zipFilename);

		try (OutputStream fileOut = Files.newOutputStream(zipPath);
				ZipOutputStream zip = new ZipOutputStream(fileOut);
				Stream<Path> files = Files.list(workDir)) {
			files.filter(path -> path.getFileName().toString().toLowerCase().endsWith(".pdf"))
					.forEach(path -> writeEntry(zip, path));
			zip.finish();
		}

		run.setZipPath(zipPath.toAbsolutePath().toString());
		run.setZipFilename(zipFilename);
		runRepository.save(run);
		progressPublisher.publish(OrderBulkGenerateService.toDto(run));
		return RepeatStatus.FINISHED;
	}

	private static void writeEntry(ZipOutputStream zip, Path path) {
		try {
			zip.putNextEntry(new ZipEntry(path.getFileName().toString()));
			Files.copy(path, zip);
			zip.closeEntry();
		} catch (IOException ex) {
			throw new BusinessRuleException("Unable to add PDF to ZIP: " + path.getFileName());
		}
	}
}
