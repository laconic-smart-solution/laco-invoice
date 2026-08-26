package com.laconic.lacoinvoice.features.order.import_;

import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
@DisallowConcurrentExecution
public class OrderImportPreviewCleanupQuartzJob implements Job {

	private static final Logger log = LoggerFactory.getLogger(OrderImportPreviewCleanupQuartzJob.class);

	private final OrderImportPreviewCleanupService cleanupService;

	public OrderImportPreviewCleanupQuartzJob(OrderImportPreviewCleanupService cleanupService) {
		this.cleanupService = cleanupService;
	}

	@Override
	public void execute(JobExecutionContext context) {
		log.info("Scheduled order-import preview cleanup started");
		OrderImportPreviewCleanupService.CleanupResult result = cleanupService.purgeExpiredStaging();
		log.info(
				"Scheduled order-import preview cleanup finished: expired={}, deletedItems={}, deletedOrders={}, deletedBatches={}",
				result.expiredBatches(),
				result.deletedItems(),
				result.deletedOrders(),
				result.deletedBatches());
	}
}
