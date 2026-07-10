package com.laconic.lacoinvoice.config;

import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.features.auth.AuthCookieService;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class CookieBearerTokenResolver implements BearerTokenResolver {

	private final AuthCookieService authCookieService;

	public CookieBearerTokenResolver(AuthCookieService authCookieService) {
		this.authCookieService = authCookieService;
	}

	@Override
	public String resolve(HttpServletRequest request) {
		String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (StringUtils.hasText(authorization) && authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
			return authorization.substring(7).trim();
		}
		return authCookieService.readAccessToken(request);
	}
}
