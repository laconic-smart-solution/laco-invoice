package com.laconic.lacoinvoice.features.user;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.service.BaseServiceImpl;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.config.SsoProperties;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.features.user.UserCommands.ChangeCredentialsRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.CreateRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.UpdateRoleRequest;
import com.laconic.lacoinvoice.features.user.pageable.UserPageRequest;
import com.laconic.lacoinvoice.integration.sso.LcnSsoClient;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoSignupResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoUserResponse;

@Service
public class UserServiceImpl extends BaseServiceImpl<User, UserDto, CreateRequest, UpdateRequest> implements UserService {

	private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

	private final UserRepository repository;
	private final UserMapper mapper;
	private final SsoProperties ssoProperties;
	private final LcnSsoClient lcnSsoClient;

	public UserServiceImpl(
			UserRepository repository,
			UserMapper mapper,
			SsoProperties ssoProperties,
			LcnSsoClient lcnSsoClient) {
		this.repository = repository;
		this.mapper = mapper;
		this.ssoProperties = ssoProperties;
		this.lcnSsoClient = lcnSsoClient;
	}

	@Override
	public UserDto create(CreateRequest request) {
		String password = request.getPassword();
		String rollbackSsoUserId = null;
		try {
			if (StringUtils.hasText(password)) {
				validateSsoSignupRequest(request);
				String signupUrl = buildSignupUrl();
				log.info("SSO sign-up: url={} username={} email={}", signupUrl, request.getUsername(), request.getEmail());
				Map<String, Object> payload = new HashMap<>();
				payload.put("username", request.getUsername().trim());
				payload.put("email", request.getEmail().trim());
				payload.put("password", password);
				String[] nameParts = splitFullName(request.getFullName());
				payload.put("firstName", nameParts[0]);
				payload.put("lastName", nameParts[1]);
				payload.put("profileImage", null);

				LcnSsoSignupResponse ssoResponse = lcnSsoClient.signUp(signupUrl, payload);
				String ssoUserId = ssoResponse.getData().userId();
				request.setAuthServerUserId(ssoUserId);
				rollbackSsoUserId = ssoUserId;
			} else if (!StringUtils.hasText(request.getAuthServerUserId())) {
				throw new IllegalArgumentException(
						"Either password (SSO sign-up) or authServerUserId (link existing SSO user) is required.");
			}

			User entity = createEntity(request);
			User saved = repository.save(entity);
			return mapper.toDto(saved);
		} catch (RuntimeException e) {
			if (rollbackSsoUserId != null && StringUtils.hasText(ssoProperties.getUrl())) {
				try {
					lcnSsoClient.deleteUser(ssoProperties.getUrl(), rollbackSsoUserId);
				} catch (Exception rollbackEx) {
					log.error("Failed to rollback SSO user after local save failure: authServerUserId={}", rollbackSsoUserId,
							rollbackEx);
				}
			}
			throw e;
		} finally {
			request.setPassword(null);
		}
	}

	private void validateSsoSignupRequest(CreateRequest request) {
		if (!StringUtils.hasText(ssoProperties.getSignup().getUrl())) {
			throw new IllegalArgumentException("SSO sign-up is not configured (set sso.signup.url).");
		}
		if (!StringUtils.hasText(ssoProperties.getApplicationCode())) {
			throw new IllegalArgumentException("SSO application code is not configured (set sso.application-code).");
		}
		if (!StringUtils.hasText(request.getUsername())) {
			throw new IllegalArgumentException("username is required when password is set (SSO sign-up).");
		}
	}

	private String buildSignupUrl() {
		String base = ssoProperties.getSignup().getUrl().trim();
		String code = ssoProperties.getApplicationCode().trim();
		if (base.contains("?")) {
			return base + "&applicationCode=" + code;
		}
		return base + "?applicationCode=" + code;
	}

	private static String[] splitFullName(String fullName) {
		if (!StringUtils.hasText(fullName)) {
			return new String[] { "", "" };
		}
		String trimmed = fullName.trim();
		int space = trimmed.indexOf(' ');
		if (space < 0) {
			return new String[] { trimmed, "" };
		}
		return new String[] { trimmed.substring(0, space), trimmed.substring(space + 1).trim() };
	}

	@Override
	@Transactional(readOnly = true)
	public UserDto getByAuthServerUserId(String authServerUserId) {
		String value = authServerUserId == null ? "" : authServerUserId.trim();
		if (!StringUtils.hasText(value)) {
			throw new IllegalArgumentException("authServerUserId is required.");
		}
		User entity = repository.findByAuthServerUserId(value)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: authServerUserId=" + value));
		return mapper.toDto(entity);
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isAdmin()")
	public ApiResponse<List<UserDto>> page(UserPageRequest request) {
		return PageQuerySupport.queryWithMap(
				repository,
				mapper,
				request.toPageAndFilter(),
				User.class,
				ObjectMapUtils.toMap(request.getFilter()),
				null);
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isAdmin()")
	public void verifyUserOtp(Long id) {
		User user = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: id=" + id));
		String authServerUserId = user.getAuthServerUserId();
		if (!StringUtils.hasText(authServerUserId)) {
			throw new IllegalArgumentException("User is not linked to the identity server: id=" + id);
		}
		if (!StringUtils.hasText(ssoProperties.getUrl())) {
			throw new IllegalStateException("SSO base URL is not configured (set sso.url).");
		}
		lcnSsoClient.verifyOtp(ssoProperties.getUrl(), authServerUserId.trim());
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isAdmin()")
	public UserDto changeUserCredentials(Long id, ChangeCredentialsRequest request) {
		User user = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: id=" + id));
		String authServerUserId = user.getAuthServerUserId();
		if (!StringUtils.hasText(authServerUserId)) {
			throw new IllegalArgumentException("User is not linked to the identity server: id=" + id);
		}
		if (!StringUtils.hasText(ssoProperties.getUrl())) {
			throw new IllegalStateException("SSO base URL is not configured (set sso.url).");
		}

		String newEmail = StringUtils.hasText(request.getNewEmail()) ? request.getNewEmail().trim() : null;
		String newUsername = StringUtils.hasText(request.getNewUsername()) ? request.getNewUsername().trim() : null;

		if (newEmail != null && !newEmail.equalsIgnoreCase(user.getEmail())
				&& repository.existsByEmailIgnoreCase(newEmail)) {
			throw new ResourceConflictException("Email already in use.");
		}

		Map<String, Object> payload = new HashMap<>();
		if (newEmail != null) {
			payload.put("email", newEmail);
		}
		if (newUsername != null) {
			payload.put("username", newUsername);
		}
		if (payload.isEmpty()) {
			throw new IllegalArgumentException("Provide a new email or a new username.");
		}

		LcnSsoUserResponse ssoResponse = lcnSsoClient.updateUser(
				ssoProperties.getUrl(),
				authServerUserId.trim(),
				payload);

		if (StringUtils.hasText(ssoResponse.getEmail())) {
			user.setEmail(ssoResponse.getEmail().trim());
		} else if (newEmail != null) {
			user.setEmail(newEmail);
		}

		return mapper.toDto(repository.save(user));
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isAdmin()")
	public UserDto updateUserRole(Long id, UpdateRoleRequest request) {
		User user = repository.findById(id).orElseThrow(() -> notFound(id));
		user.setRole(request.getRole());
		return mapper.toDto(repository.save(user));
	}

	@Override
	protected JpaRepository<User, Long> repository() {
		return repository;
	}

	@Override
	protected BaseMapper<User, UserDto> mapper() {
		return mapper;
	}

	@Override
	protected User createEntity(CreateRequest request) {
		String email = request.getEmail().trim();
		if (repository.existsByEmailIgnoreCase(email)) {
			throw new ResourceConflictException("Email already in use.");
		}

		User entity = new User();
		entity.setEmail(email);
		entity.setFullName(request.getFullName());
		entity.setRole(request.getRole());
		entity.setActive(request.getActive() == null || request.getActive());

		if (!StringUtils.hasText(request.getAuthServerUserId())) {
			throw new IllegalStateException("authServerUserId must be set before persisting user.");
		}
		entity.setAuthServerUserId(request.getAuthServerUserId().trim());
		return entity;
	}

	@Override
	protected void updateEntity(User entity, UpdateRequest request) {
		String email = request.getEmail().trim();
		if (!email.equalsIgnoreCase(entity.getEmail()) && repository.existsByEmailIgnoreCase(email)) {
			throw new ResourceConflictException("Email already in use.");
		}
		entity.setEmail(email);
		entity.setFullName(request.getFullName());
		entity.setRole(request.getRole());
		if (request.getActive() != null) {
			entity.setActive(request.getActive());
		}
		if (StringUtils.hasText(request.getAuthServerUserId())) {
			entity.setAuthServerUserId(request.getAuthServerUserId().trim());
		}
	}

	@Override
	@PreAuthorize("@authz.isAdmin()")
	public UserDto getById(Long id) {
		return super.getById(id);
	}

	@Override
	@PreAuthorize("@authz.isAdmin()")
	public List<UserDto> getAll() {
		return super.getAll();
	}

	@Override
	@PreAuthorize("@authz.isAdmin()")
	public UserDto update(Long id, UpdateRequest request) {
		return super.update(id, request);
	}

	@Override
	@PreAuthorize("@authz.isAdmin()")
	public void delete(Long id) {
		super.delete(id);
	}
}
