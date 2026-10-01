package com.laconic.lacoinvoice.config.websocket;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.models.UserRole;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceProductSyncRunRepository;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.features.marketplaceproduct.MarketplaceProductSyncService;

@Component
public class MarketplaceProductSyncStompChannelInterceptor implements ChannelInterceptor {

	public static final String SYNC_TOPIC_PREFIX = "/topic/marketplace-product-sync/";
	private static final Pattern SYNC_TOPIC_PATTERN = Pattern.compile("^/topic/marketplace-product-sync/(\\d+)$");

	private final UserRepository userRepository;
	private final MarketplaceProductSyncRunRepository syncRunRepository;
	private final SimpMessagingTemplate messagingTemplate;

	public MarketplaceProductSyncStompChannelInterceptor(
			UserRepository userRepository,
			MarketplaceProductSyncRunRepository syncRunRepository,
			@Lazy SimpMessagingTemplate messagingTemplate) {
		this.userRepository = userRepository;
		this.syncRunRepository = syncRunRepository;
		this.messagingTemplate = messagingTemplate;
	}

	@Override
	public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null) {
			return message;
		}

		StompCommand command = accessor.getCommand();
		if (command == null) {
			return message;
		}

		if (command == StompCommand.CONNECT || command == StompCommand.SUBSCRIBE) {
			requireOwnerOrAdmin();
		}

		if (command == StompCommand.SUBSCRIBE) {
			String destination = accessor.getDestination();
			if (destination != null && destination.startsWith(SYNC_TOPIC_PREFIX)) {
				sendCurrentSnapshot(destination);
			}
		}

		return message;
	}

	private void requireOwnerOrAdmin() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null
				|| !authentication.isAuthenticated()
				|| authentication instanceof AnonymousAuthenticationToken) {
			throw new AccessDeniedException(
					"Authenticated owner or admin role is required for marketplace sync subscriptions.");
		}
		if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
			throw new AccessDeniedException(
					"Authenticated owner or admin role is required for marketplace sync subscriptions.");
		}
		UserRole role = resolveCurrentUser(jwt).map(User::getRole).orElse(null);
		if (role != UserRole.OWNER && role != UserRole.ADMIN) {
			throw new AccessDeniedException(
					"Authenticated owner or admin role is required for marketplace sync subscriptions.");
		}
	}

	private Optional<User> resolveCurrentUser(Jwt jwt) {
		String authServerUserId = firstNonBlank(
				jwt.getClaimAsString("userid"),
				jwt.getClaimAsString("sub"));
		Optional<User> user = Optional.empty();
		if (StringUtils.hasText(authServerUserId)) {
			user = userRepository.findByAuthServerUserId(authServerUserId.trim());
		}
		if (user.isEmpty()) {
			String email = jwt.getClaimAsString("email");
			if (StringUtils.hasText(email)) {
				user = userRepository.findByEmailIgnoreCase(email.trim());
			}
		}
		return user;
	}

	private static String firstNonBlank(String... values) {
		if (values == null) {
			return null;
		}
		for (String value : values) {
			if (StringUtils.hasText(value)) {
				return value;
			}
		}
		return null;
	}

	private void sendCurrentSnapshot(String destination) {
		Matcher matcher = SYNC_TOPIC_PATTERN.matcher(destination);
		if (!matcher.matches()) {
			return;
		}
		Long syncRunId = Long.parseLong(matcher.group(1));
		syncRunRepository.findById(syncRunId)
				.ifPresent(run -> messagingTemplate.convertAndSend(
						destination,
						MarketplaceProductSyncService.toDto(run)));
	}
}
