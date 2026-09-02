package com.laconic.lacoinvoice.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.config.OrderInputAiProperties;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.models.UserSettings;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.domain.repositories.UserSettingsRepository;
import com.laconic.lacoinvoice.features.usersettings.UserSettingsService;

@Component
@Order(6)
public class UserSettingsBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(UserSettingsBootstrap.class);

	private final UserRepository userRepository;
	private final UserSettingsRepository userSettingsRepository;
	private final UserSettingsService userSettingsService;
	private final DefaultAdminAccountProperties defaultAdminProperties;
	private final OrderInputAiProperties orderInputAiProperties;

	public UserSettingsBootstrap(
			UserRepository userRepository,
			UserSettingsRepository userSettingsRepository,
			UserSettingsService userSettingsService,
			DefaultAdminAccountProperties defaultAdminProperties,
			OrderInputAiProperties orderInputAiProperties) {
		this.userRepository = userRepository;
		this.userSettingsRepository = userSettingsRepository;
		this.userSettingsService = userSettingsService;
		this.defaultAdminProperties = defaultAdminProperties;
		this.orderInputAiProperties = orderInputAiProperties;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		for (User user : userRepository.findAll()) {
			userSettingsService.ensureForUser(user);
		}

		if (!orderInputAiProperties.isDefaultAdminEnabled()) {
			return;
		}

		String adminEmail = defaultAdminProperties.getEmail();
		if (!StringUtils.hasText(adminEmail)) {
			return;
		}

		userRepository.findByEmailIgnoreCase(adminEmail.trim()).ifPresent(user -> {
			UserSettings settings = userSettingsService.ensureForUser(user);
			if (!settings.isAiAutoChooseInputFileType()) {
				settings.setAiAutoChooseInputFileType(true);
				userSettingsRepository.save(settings);
				log.info("Enabled AI auto-choose input file type for default admin user email={}", adminEmail);
			}
		});
	}
}
