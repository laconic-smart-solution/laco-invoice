package com.laconic.lacoinvoice.features.auth;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.laconic.lacoinvoice.config.SsoProperties;
import com.laconic.lacoinvoice.features.auth.dto.AuthChangePasswordRequest;
import com.laconic.lacoinvoice.features.auth.dto.AuthLoginRequest;
import com.laconic.lacoinvoice.features.auth.dto.AuthResendOtpRequest;
import com.laconic.lacoinvoice.features.auth.dto.AuthSessionDto;
import com.laconic.lacoinvoice.features.auth.dto.AuthVerifyOtpRequest;
import com.laconic.lacoinvoice.integration.sso.LcnSsoClient;
import com.laconic.lacoinvoice.integration.sso.dto.AuthTokenDto;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoAuthApiResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoUserTokenWithAttributesResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthService {

	private final SsoProperties ssoProperties;
	private final LcnSsoClient lcnSsoClient;
	private final AuthCookieService authCookieService;

	public AuthService(SsoProperties ssoProperties, LcnSsoClient lcnSsoClient, AuthCookieService authCookieService) {
		this.ssoProperties = ssoProperties;
		this.lcnSsoClient = lcnSsoClient;
		this.authCookieService = authCookieService;
	}

	public AuthSessionDto login(AuthLoginRequest request, HttpServletResponse response) {
		LcnSsoAuthApiResponse ssoResponse = lcnSsoClient.login(
				ssoProperties.getUrl(),
				ssoProperties.getApplicationCode(),
				request.getIdentifier(),
				request.getPassword());
		return handleAuthResponse(ssoResponse.getData(), request.isRememberMe(), response);
	}

	public AuthSessionDto verifyOtp(AuthVerifyOtpRequest request, HttpServletResponse response) {
		LcnSsoAuthApiResponse ssoResponse = lcnSsoClient.verifyOtpAuth(
				ssoProperties.getUrl(),
				ssoProperties.getApplicationCode(),
				request.getEmail(),
				request.getOtp());
		return handleAuthResponse(ssoResponse.getData(), request.isRememberMe(), response);
	}

	public void resendOtp(AuthResendOtpRequest request) {
		lcnSsoClient.resendOtp(ssoProperties.getUrl(), request.getEmail());
	}

	public void refresh(HttpServletRequest request, HttpServletResponse response, boolean rememberMe) {
		String refreshToken = authCookieService.readRefreshToken(request);
		if (!StringUtils.hasText(refreshToken)) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing refresh token.");
		}
		AuthTokenDto token = lcnSsoClient.refresh(
				ssoProperties.getUrl(),
				ssoProperties.getApplicationCode(),
				refreshToken);
		authCookieService.writeTokens(response, token, rememberMe);
	}

	public void logout(HttpServletResponse response) {
		authCookieService.clearTokens(response);
	}

	public void changePassword(
			AuthChangePasswordRequest request,
			HttpServletRequest httpRequest,
			HttpServletResponse response) {
		String accessToken = authCookieService.readAccessToken(httpRequest);
		if (!StringUtils.hasText(accessToken)) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing access token.");
		}
		lcnSsoClient.changePasswordAuth(ssoProperties.getUrl(), accessToken, request.getNewPassword());
		authCookieService.clearTokens(response);
	}

	private AuthSessionDto handleAuthResponse(
			LcnSsoUserTokenWithAttributesResponse data,
			boolean rememberMe,
			HttpServletResponse response) {
		boolean otpVerified = Boolean.TRUE.equals(data.otpVerified());
		if (otpVerified && data.token() != null) {
			authCookieService.writeTokens(response, data.token(), rememberMe);
		}
		return toSessionDto(data, otpVerified);
	}

	private static AuthSessionDto toSessionDto(LcnSsoUserTokenWithAttributesResponse data, boolean otpVerified) {
		Long userId = null;
		if (StringUtils.hasText(data.userId())) {
			try {
				userId = Long.parseLong(data.userId());
			} catch (NumberFormatException ignored) {
				userId = null;
			}
		}
		return new AuthSessionDto(userId, data.email(), otpVerified);
	}
}
