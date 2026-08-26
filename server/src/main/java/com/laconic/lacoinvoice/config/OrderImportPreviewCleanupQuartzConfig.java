package com.laconic.lacoinvoice.config;

import org.quartz.CronScheduleBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.laconic.lacoinvoice.features.order.import_.OrderImportPreviewCleanupQuartzJob;

@Configuration
@ConditionalOnProperty(name = "app.order-import.preview-cleanup.quartz.enabled", havingValue = "true")
public class OrderImportPreviewCleanupQuartzConfig {

	@Bean
	public JobDetail orderImportPreviewCleanupJobDetail() {
		return JobBuilder.newJob(OrderImportPreviewCleanupQuartzJob.class)
				.withIdentity("orderImportPreviewCleanupJob")
				.storeDurably()
				.build();
	}

	@Bean
	public Trigger orderImportPreviewCleanupTrigger(
			JobDetail orderImportPreviewCleanupJobDetail,
			OrderImportPreviewCleanupQuartzProperties properties) {
		return TriggerBuilder.newTrigger()
				.forJob(orderImportPreviewCleanupJobDetail)
				.withIdentity("orderImportPreviewCleanupTrigger")
				.withSchedule(CronScheduleBuilder.cronSchedule(properties.getCron())
						.inTimeZone(java.util.TimeZone.getTimeZone(properties.getTimezone())))
				.build();
	}
}
