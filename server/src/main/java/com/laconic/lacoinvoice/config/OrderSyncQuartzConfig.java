package com.laconic.lacoinvoice.config;

import org.quartz.CronScheduleBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.laconic.lacoinvoice.features.sync.OrderSyncQuartzJob;

@Configuration
@EnableConfigurationProperties(OrderSyncQuartzProperties.class)
@ConditionalOnProperty(name = "app.sync.quartz.enabled", havingValue = "true")
public class OrderSyncQuartzConfig {

	@Bean
	public JobDetail orderSyncJobDetail() {
		return JobBuilder.newJob(OrderSyncQuartzJob.class)
				.withIdentity("orderSyncJob")
				.storeDurably()
				.build();
	}

	@Bean
	public Trigger orderSyncTrigger(JobDetail orderSyncJobDetail, OrderSyncQuartzProperties properties) {
		return TriggerBuilder.newTrigger()
				.forJob(orderSyncJobDetail)
				.withIdentity("orderSyncTrigger")
				.withSchedule(CronScheduleBuilder.cronSchedule(properties.getCron())
						.inTimeZone(java.util.TimeZone.getTimeZone(properties.getTimezone())))
				.build();
	}
}
