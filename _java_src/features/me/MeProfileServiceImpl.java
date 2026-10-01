package com.laconic.lacoinvoice.features.me;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.config.SsoProperties;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.features.me.dto.MeCredentialsRequest;
import com.laconic.lacoinvoice.features.me.dto.MeProfileDto;
import com.laconic.lacoinvoice.features.usersettings.UserSettingsService;
import com.laconic.lacoinvoice.integration.sso.LcnSsoClient;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoCredentialsResponse;

@Service
public class MeProfileServiceImpl implements MeProfileService {

	private final UserRepository userRepository;
	private final SsoProperties ssoProperties;
	private final LcnSsoClient lcnSsoClient;
	private final UserSettingsService userSettingsService;

	public MeProfileServiceImpl(
			UserRepository userRepository,
			SsoProperties ssoProperties,
			LcnSsoClient lcnSsoClient,
			UserSettingsService userSettingsService) {
		this.userRepository = userRepository;
		this.ssoProperties = ssoProperties;
		this.lcnSsoClient = lcnSsoClient;
		this.userSettingsService = userSettingsService;
	}

	@Override
	@Transactional(readOnly = true)
	public MeProfileDto getMyProfile() {
		User user = currentUser();
		return toDto(user, userSettingsService.isAiAutoChooseInputFileType(user.getId()));
	}

	@Override
	@Transactional
	public MeProfileDto changeMyCredentials(MeCredentialsRequest request) {
		User user = currentUser();

		String authServerUserId = user.getAuthServerUserId();
		if (!StringUtils.hasText(authServerUserId)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"This account is not linked to the identity server.");
		}
		if (!StringUtils.hasText(ssoProperties.getUrl())) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"SSO base URL is not configured (set sso.url).");
		}

		String newEmail = StringUtils.hasText(request.getNewEmail()) ? request.getNewEmail().trim() : null;
		String newUsername = StringUtils.hasText(request.getNewUsername()) ? request.getNewUsername().trim() : null;

		if (newEmail != null && !newEmail.equalsIgnoreCase(user.getEmail())
				&& userRepository.existsByEmailIgnoreCase(newEmail)) {
			throw new ResourceConflictException("Email already in use.");
		}

		Map<String, Object> payload = new HashMap<>();
		payload.put("userId", authServerUserId);
		payload.put("currentPassword", request.getCurrentPassword());
		payload.put("newEmail", newEmail);
		payload.put("newUsername", newUsername);

		LcnSsoCredentialsResponse ssoResponse = lcnSsoClient.changeCredentials(ssoProperties.getUrl(), payload);

		if (StringUtils.hasText(ssoResponse.getEmail())) {
			user.setEmail(ssoResponse.getEmail().trim());
		} else if (newEmail != null) {
			user.setEmail(newEmail);
		}

		User saved = userRepository.save(user);
		return toDto(saved, userSettingsService.isAiAutoChooseInputFileType(saved.getId()));
	}

	private User currentUser() {
		String authUserId = AuditUserContext.getCurrentUserId()	
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated. Auth server user id not found."));
		return userRepository.findByAuthServerUserId(authUserId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated."));
	}

	private static MeProfileDto toDto(User user, boolean orderInputAiAutoChoose) {
		MeProfileDto dto = new MeProfileDto();
		dto.setId(user.getId());
		dto.setEmail(user.getEmail());
		dto.setFullName(user.getFullName());
		dto.setRole(user.getRole());
		dto.setActive(user.isActive());
		dto.setOrderInputAiAutoChoose(orderInputAiAutoChoose);
		return dto;
	}
}
