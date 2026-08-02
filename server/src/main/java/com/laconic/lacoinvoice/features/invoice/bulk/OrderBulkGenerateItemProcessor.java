package com.laconic.lacoinvoice.features.invoice.bulk;

import java.nio.file.Files;
import java.nio.file.Path;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.repositories.OrderBulkGenerateRunRepository;
import com.laconic.lacoinvoice.features.invoice.InvoiceService;

@Component
@StepScope
public class OrderBulkGenerateItemProcessor implements ItemProcessor<Long, OrderBulkGeneratePdfItem> {

	private static final Logger log = LoggerFactory.getLogger(OrderBulkGenerateItemProcessor.class);

	private final InvoiceService invoiceService;
	private final OrderBulkGenerateProgressService progressService;
	private final OrderBulkGenerateRunRepository runRepository;
	private final Long runId;

	public OrderBulkGenerateItemProcessor(
			InvoiceService invoiceService,
			OrderBulkGenerateProgressService progressService,
			OrderBulkGenerateRunRepository runRepository,
			@Value("#{jobParameters['runId']}") Long runId) {
		this.invoiceService = invoiceService;
		this.progressService = progressService;
		this.runRepository = runRepository;
		this.runId = runId;
	}

	@Override
	public OrderBulkGeneratePdfItem process(Long orderId) {
		if (orderId == null) {
			return null;
		}
		try {
			InvoiceService.OrderInvoicePdf pdf = invoiceService.buildPdfForOrder(orderId);
			String workDir = runRepository.findById(runId)
					.map(run -> run.getWorkDir())
					.orElseThrow(() -> new IllegalStateException("Bulk generate run not found: id=" + runId));
			Path dir = Path.of(workDir);
			Files.createDirectories(dir);
			Path target = uniquePath(dir, pdf.filename());
			Files.write(target, pdf.content());
			return new OrderBulkGeneratePdfItem(target, target.getFileName().toString());
		} catch (Exception ex) {
			log.warn("Failed to generate PDF for order id={} in run id={}", orderId, runId, ex);
			progressService.incrementFailed(runId);
			return null;
		}
	}

	private static Path uniquePath(Path dir, String filename) {
		Path candidate = dir.resolve(filename);
		if (!Files.exists(candidate)) {
			return candidate;
		}
		String base = filename;
		String ext = "";
		int dot = filename.lastIndexOf('.');
		if (dot > 0) {
			base = filename.substring(0, dot);
			ext = filename.substring(dot);
		}
		int index = 2;
		do {
			candidate = dir.resolve(base + "-" + index + ext);
			index++;
		} while (Files.exists(candidate));
		return candidate;
	}
}
