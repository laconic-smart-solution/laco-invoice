package com.laconic.lacoinvoice.features.invoice.bulk;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class OrderBulkGenerateProgressRelayConfig {

	@Bean
	RedisMessageListenerContainer orderBulkGenerateProgressListenerContainer(
			RedisConnectionFactory connectionFactory,
			OrderBulkGenerateProgressRelay progressRelay) {
		RedisMessageListenerContainer container = new RedisMessageListenerContainer();
		container.setConnectionFactory(connectionFactory);
		container.addMessageListener(
				progressRelay,
				new ChannelTopic(OrderBulkGenerateProgressPublisher.CHANNEL));
		return container;
	}
}
