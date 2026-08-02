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
import com.laconic.lacoinvoice.domain.repositories.OrderBulkGenerateRunRepository;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.features.invoice.bulk.OrderBulkGenerateService;

@Component
public class OrderBulkGenerateStompChannelInterceptor implements ChannelInterceptor {

	public static final String TOPIC_PREFIX = "/topic/order-bulk-generate/";
	private static final Pattern TOPIC_PATTERN = Pattern.compile("^/topic/order-bulk-generate/(\\d+)$");

	private final UserRepository userRepository;
	private final OrderBulkGenerateRunRepository runRepository;
	private final SimpMessagingTemplate messagingTemplate;

	public OrderBulkGenerateStompChannelInterceptor(
			UserRepository userRepository,
			OrderBulkGenerateRunRepository runRepository,
			@Lazy SimpMessagingTemplate messagingTemplate) {
		this.userRepository = userRepository;
		this.runRepository = runRepository;
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

		String destination = accessor.getDestination();
		boolean isBulkTopic = destination != null && destination.startsWith(TOPIC_PREFIX);

		if ((command == StompCommand.CONNECT || command == StompCommand.SUBSCRIBE) && isBulkTopic) {
			requireOwnerOrAdmin();
		}

		if (command == StompCommand.SUBSCRIBE && isBulkTopic) {
			sendCurrentSnapshot(destination);
		}

		return message;
	}

	private void requireOwnerOrAdmin() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null
				|| !authentication.isAuthenticated()
				|| authentication instanceof AnonymousAuthenticationToken) {
			throw new AccessDeniedException(
					"Authenticated owner or admin role is required for bulk generate subscriptions.");
		}
		if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
			throw new AccessDeniedException(
					"Authenticated owner or admin role is required for bulk generate subscriptions.");
		}
		UserRole role = resolveCurrentUser(jwt).map(User::getRole).orElse(null);
		if (role != UserRole.OWNER && role != UserRole.ADMIN) {
			throw new AccessDeniedException(
					"Authenticated owner or admin role is required for bulk generate subscriptions.");
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
		Matcher matcher = TOPIC_PATTERN.matcher(destination);
		if (!matcher.matches()) {
			return;
		}
		Long runId = Long.parseLong(matcher.group(1));
		runRepository.findById(runId)
				.ifPresent(run -> messagingTemplate.convertAndSend(
						destination,
						OrderBulkGenerateService.toDto(run)));
	}
}
