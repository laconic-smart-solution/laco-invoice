package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class MarketplaceProductSyncProgressRelayConfig {

	@Bean
	RedisMessageListenerContainer marketplaceProductSyncProgressListenerContainer(
			RedisConnectionFactory connectionFactory,
			MarketplaceProductSyncProgressRelay progressRelay) {
		RedisMessageListenerContainer container = new RedisMessageListenerContainer();
		container.setConnectionFactory(connectionFactory);
		container.addMessageListener(
				progressRelay,
				new ChannelTopic(MarketplaceProductSyncProgressPublisher.CHANNEL));
		return container;
	}
}
