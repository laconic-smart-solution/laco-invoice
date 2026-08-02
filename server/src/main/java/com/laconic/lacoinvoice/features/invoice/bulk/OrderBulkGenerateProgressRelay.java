package com.laconic.lacoinvoice.features.invoice.bulk;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.config.websocket.OrderBulkGenerateStompChannelInterceptor;

@Component
public class OrderBulkGenerateProgressRelay implements MessageListener {

	private static final Logger log = LoggerFactory.getLogger(OrderBulkGenerateProgressRelay.class);

	private final SimpMessagingTemplate messagingTemplate;

	public OrderBulkGenerateProgressRelay(SimpMessagingTemplate messagingTemplate) {
		this.messagingTemplate = messagingTemplate;
	}

	@Override
	public void onMessage(Message message, byte[] pattern) {
		if (message.getBody() == null || message.getBody().length == 0) {
			return;
		}
		try {
			String payload = new String(message.getBody(), StandardCharsets.UTF_8);
			OrderBulkGenerateRunDto dto = OrderBulkGenerateProgressJson.fromJson(payload);
			if (dto.id() == null) {
				return;
			}
			messagingTemplate.convertAndSend(
					OrderBulkGenerateStompChannelInterceptor.TOPIC_PREFIX + dto.id(),
					dto);
		} catch (Exception ex) {
			log.warn("Failed to relay order bulk-generate progress message", ex);
		}
	}
}
