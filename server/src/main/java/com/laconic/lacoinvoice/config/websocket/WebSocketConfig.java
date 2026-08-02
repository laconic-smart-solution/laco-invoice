package com.laconic.lacoinvoice.config.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.messaging.context.SecurityContextChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.laconic.lacoinvoice.config.LacoinvoiceCorsProperties;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final LacoinvoiceCorsProperties corsProperties;
	private final MarketplaceProductSyncStompChannelInterceptor syncStompChannelInterceptor;
	private final OrderBulkGenerateStompChannelInterceptor bulkGenerateStompChannelInterceptor;

	public WebSocketConfig(
			LacoinvoiceCorsProperties corsProperties,
			MarketplaceProductSyncStompChannelInterceptor syncStompChannelInterceptor,
			OrderBulkGenerateStompChannelInterceptor bulkGenerateStompChannelInterceptor) {
		this.corsProperties = corsProperties;
		this.syncStompChannelInterceptor = syncStompChannelInterceptor;
		this.bulkGenerateStompChannelInterceptor = bulkGenerateStompChannelInterceptor;
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		var registration = registry.addEndpoint("/ws");
		String[] origins = corsProperties.allowedOriginPatternArray();
		if (origins.length > 0) {
			registration.setAllowedOriginPatterns(origins);
		}
		registration.withSockJS();
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/topic");
		registry.setApplicationDestinationPrefixes("/app");
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(
				new SecurityContextChannelInterceptor(),
				syncStompChannelInterceptor,
				bulkGenerateStompChannelInterceptor);
	}
}
