package com.laconic.lacoinvoice.features.usersettings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.models.UserSettings;
import com.laconic.lacoinvoice.domain.repositories.UserSettingsRepository;

@Service
public class UserSettingsServiceImpl implements UserSettingsService {

	private final UserSettingsRepository repository;

	public UserSettingsServiceImpl(UserSettingsRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional
	public UserSettings ensureForUser(User user) {
		return repository.findByUser_Id(user.getId())
				.orElseGet(() -> {
					UserSettings settings = new UserSettings();
					settings.setUser(user);
					settings.setAiAutoChooseInputFileType(false);
					return repository.save(settings);
				});
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isAiAutoChooseInputFileType(Long userId) {
		if (userId == null) {
			return false;
		}
		return repository.findByUser_Id(userId)
				.map(UserSettings::isAiAutoChooseInputFileType)
				.orElse(false);
	}
}
