package com.laconic.lacoinvoice.features.sync;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.features.order.OrderSyncService;

@Component
public class OrderSyncQuartzJob implements Job {

	private static final Logger log = LoggerFactory.getLogger(OrderSyncQuartzJob.class);

	private final OrderSyncService orderSyncService;

	public OrderSyncQuartzJob(OrderSyncService orderSyncService) {
		this.orderSyncService = orderSyncService;
	}

	@Override
	public void execute(JobExecutionContext context) {
		log.info("Scheduled order sync started");
		orderSyncService.ingestAllActiveStores();
		log.info("Scheduled order sync finished");
	}
}
