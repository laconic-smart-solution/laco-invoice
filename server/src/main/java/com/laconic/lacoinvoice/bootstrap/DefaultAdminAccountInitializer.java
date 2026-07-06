package com.laconic.lacoinvoice.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.features.user.UserCommands.CreateRequest;
import com.laconic.lacoinvoice.features.user.UserService;

@Component
@Order(5)
@ConditionalOnProperty(name = "app.users.default-admin.enabled", havingValue = "true")
public class DefaultAdminAccountInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DefaultAdminAccountInitializer.class);

	private final DefaultAdminAccountProperties properties;
	private final UserRepository userRepository;
	private final UserService userService;

	public DefaultAdminAccountInitializer(
			DefaultAdminAccountProperties properties,
			UserRepository userRepository,
			UserService userService) {
		this.properties = properties;
		this.userRepository = userRepository;
		this.userService = userService;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		String email = properties.getEmail().trim();
		if (email.isEmpty()) {
			log.warn("Default admin seed skipped: app.users.default-admin.email is empty.");
			return;
		}

		if (userRepository.existsByEmailIgnoreCase(email)) {
			log.info("Default admin seed skipped: user already exists for email={}", email);
			return;
		}

		if (!StringUtils.hasText(properties.getAuthServerUserId())) {
			log.warn("Default admin seed skipped: set app.users.default-admin.auth-server-user-id (user must exist in SSO).");
			return;
		}

		CreateRequest request = new CreateRequest();
		request.setRole(properties.getRole());
		request.setEmail(email);
		request.setFullName(properties.getFullName());
		request.setUsername(properties.getUsername());
		request.setAuthServerUserId(properties.getAuthServerUserId().trim());
		request.setActive(true);

		userService.create(request);
		log.info("Default admin seed: created user for email={} role={}", email, properties.getRole());
	}
}
