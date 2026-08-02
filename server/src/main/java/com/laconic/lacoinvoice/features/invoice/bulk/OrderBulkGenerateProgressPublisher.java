package com.laconic.lacoinvoice.features.invoice.bulk;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderBulkGenerateProgressPublisher {

	public static final String CHANNEL = "order-bulk-generate:progress";

	private static final Logger log = LoggerFactory.getLogger(OrderBulkGenerateProgressPublisher.class);

	private final StringRedisTemplate redisTemplate;

	public OrderBulkGenerateProgressPublisher(StringRedisTemplate redisTemplate) {
		this.redisTemplate = redisTemplate;
	}

	public void publish(OrderBulkGenerateRunDto dto) {
		if (dto == null) {
			return;
		}
		try {
			redisTemplate.convertAndSend(CHANNEL, OrderBulkGenerateProgressJson.toJson(dto));
		} catch (Exception ex) {
			log.warn("Failed to publish order bulk-generate progress for run id={}", dto.id(), ex);
		}
	}
}
