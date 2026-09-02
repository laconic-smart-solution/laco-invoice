package com.laconic.lacoinvoice.features.usersettings;

import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.models.UserSettings;

public interface UserSettingsService {

	UserSettings ensureForUser(User user);

	boolean isAiAutoChooseInputFileType(Long userId);
}
