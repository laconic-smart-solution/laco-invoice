package com.laconic.lacoinvoice.config;

import java.io.IOException;
import java.util.Optional;

import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.laconic.lacoinvoice.common.logging.MdcKeys;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuditUserContextFilter extends OncePerRequestFilter {

	private final UserRepository userRepository;

	public AuditUserContextFilter(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		try {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
				String authServerUserId = resolveAuthServerUserId(jwt);
				if (StringUtils.hasText(authServerUserId)) {
					AuditUserContext.setCurrentUserId(authServerUserId);
					MDC.put(MdcKeys.USER_ID, authServerUserId);
				}
				resolveCurrentUser(jwt).ifPresent(user -> {
					AuditUserContext.setCurrentLocalUserId(user.getId());
					AuditUserContext.setCurrentUserRole(user.getRole());
				});
			}
			filterChain.doFilter(request, response);
		} finally {
			AuditUserContext.clear();
			MDC.remove(MdcKeys.USER_ID);
		}
	}

	private Optional<User> resolveCurrentUser(Jwt jwt) {
		String authServerUserId = resolveAuthServerUserId(jwt);
		String email = jwt.getClaimAsString("email");
		Optional<User> user = Optional.empty();
		if (StringUtils.hasText(authServerUserId)) {
			user = userRepository.findByAuthServerUserId(authServerUserId);
		}
		if (user.isEmpty() && StringUtils.hasText(email)) {
			user = userRepository.findByEmailIgnoreCase(email.trim());
		}
		return user;
	}

	private static String resolveAuthServerUserId(Jwt jwt) {
		String authServerUserId = firstNonBlank(
				jwt.getClaimAsString("userid"),
				jwt.getClaimAsString("sub"));
		return StringUtils.hasText(authServerUserId) ? authServerUserId.trim() : null;
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
}
