package com.laconic.lacoinvoice.features.auth;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.config.AuthCookieProperties;
import com.laconic.lacoinvoice.integration.sso.dto.AuthTokenDto;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthCookieService {

	private final AuthCookieProperties properties;

	public AuthCookieService(AuthCookieProperties properties) {
		this.properties = properties;
	}

	public void writeTokens(HttpServletResponse response, AuthTokenDto token, boolean rememberMe) {
		if (token == null || !StringUtils.hasText(token.getAccessToken())) {
			return;
		}
		addCookie(response, properties.getAccessName(), token.getAccessToken(), properties.getPath(),
				rememberMe ? token.getExpiresIn() : null);
		if (StringUtils.hasText(token.getRefreshToken())) {
			addCookie(response, properties.getRefreshName(), token.getRefreshToken(), properties.getRefreshPath(),
					rememberMe ? token.getRefreshExpiresIn() : null);
		}
	}

	public void clearTokens(HttpServletResponse response) {
		expireCookie(response, properties.getAccessName(), properties.getPath());
		expireCookie(response, properties.getRefreshName(), properties.getRefreshPath());
	}

	public String readAccessToken(HttpServletRequest request) {
		return readCookie(request, properties.getAccessName());
	}

	public String readRefreshToken(HttpServletRequest request) {
		return readCookie(request, properties.getRefreshName());
	}

	private void addCookie(
			HttpServletResponse response,
			String name,
			String value,
			String path,
			Long maxAgeSeconds) {
		ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
				.httpOnly(true)
				.secure(properties.isSecure())
				.path(path)
				.sameSite(properties.getSameSite());
		if (maxAgeSeconds != null && maxAgeSeconds > 0) {
			builder.maxAge(Duration.ofSeconds(maxAgeSeconds));
		}
		response.addHeader("Set-Cookie", builder.build().toString());
	}

	private void expireCookie(HttpServletResponse response, String name, String path) {
		ResponseCookie cookie = ResponseCookie.from(name, "")
				.httpOnly(true)
				.secure(properties.isSecure())
				.path(path)
				.sameSite(properties.getSameSite())
				.maxAge(Duration.ZERO)
				.build();
		response.addHeader("Set-Cookie", cookie.toString());
	}

	private String readCookie(HttpServletRequest request, String name) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}
		for (Cookie cookie : cookies) {
			if (name.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
				return cookie.getValue();
			}
		}
		return null;
	}
}
