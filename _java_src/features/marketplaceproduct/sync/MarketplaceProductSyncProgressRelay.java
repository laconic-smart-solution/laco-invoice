package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.config.websocket.MarketplaceProductSyncStompChannelInterceptor;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductSyncRunDto;

@Component
public class MarketplaceProductSyncProgressRelay implements MessageListener {

	private static final Logger log = LoggerFactory.getLogger(MarketplaceProductSyncProgressRelay.class);

	private final SimpMessagingTemplate messagingTemplate;

	public MarketplaceProductSyncProgressRelay(SimpMessagingTemplate messagingTemplate) {
		this.messagingTemplate = messagingTemplate;
	}

	@Override
	public void onMessage(Message message, byte[] pattern) {
		if (message.getBody() == null || message.getBody().length == 0) {
			return;
		}
		try {
			String payload = new String(message.getBody(), StandardCharsets.UTF_8);
			MarketplaceProductSyncRunDto dto = MarketplaceProductSyncProgressJson.fromJson(payload);
			if (dto.id() == null) {
				return;
			}
			messagingTemplate.convertAndSend(
					MarketplaceProductSyncStompChannelInterceptor.SYNC_TOPIC_PREFIX + dto.id(),
					dto);
		} catch (Exception ex) {
			log.warn("Failed to relay marketplace product sync progress message", ex);
		}
	}
}
