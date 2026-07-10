package com.laconic.lacoinvoice.config;

import java.util.Set;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.features.auth.AuthCookieService;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class CookieBearerTokenResolver implements BearerTokenResolver {

	private static final Set<String> PUBLIC_AUTH_POST_PATHS = Set.of(
			"/api/v1/auth/login",
			"/api/v1/auth/verify-otp",
			"/api/v1/auth/resend-otp",
			"/api/v1/auth/refresh",
			"/api/v1/auth/logout");

	private final AuthCookieService authCookieService;

	public CookieBearerTokenResolver(AuthCookieService authCookieService) {
		this.authCookieService = authCookieService;
	}

	@Override
	public String resolve(HttpServletRequest request) {
		if (isPublicAuthPost(request)) {
			return null;
		}

		String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (StringUtils.hasText(authorization) && authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
			return authorization.substring(7).trim();
		}
		return authCookieService.readAccessToken(request);
	}

	private static boolean isPublicAuthPost(HttpServletRequest request) {
		if (!HttpMethod.POST.matches(request.getMethod())) {
			return false;
		}
		return PUBLIC_AUTH_POST_PATHS.contains(request.getRequestURI());
	}
}
