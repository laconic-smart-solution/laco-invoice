package com.laconic.lacoinvoice.integration.sso;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.integration.sso.dto.AuthTokenDto;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoAuthApiResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoChangeCredentialsApiResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoCredentialsResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoSignupResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoTokenApiResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoUpdateUserApiResponse;
import com.laconic.lacoinvoice.integration.sso.dto.LcnSsoUserResponse;

@Component
public class LcnSsoClient {

	private static final Logger log = LoggerFactory.getLogger(LcnSsoClient.class);

	private final RestClient restClient;

	public LcnSsoClient(@Qualifier("ssoRestClient") RestClient ssoRestClient) {
		this.restClient = ssoRestClient;
	}

	static String normalizeHttpUrl(String url) {
		if (url == null) {
			return null;
		}
		String u = url.trim();
		if (u.isEmpty()) {
			return u;
		}
		if (u.startsWith("//")) {
			return "http:" + u;
		}
		if (!u.contains("://")) {
			return "http://" + u;
		}
		return u;
	}

	public LcnSsoSignupResponse signUp(String signupUrl, Map<String, Object> payload) {
		String uri = normalizeHttpUrl(signupUrl);
		try {
			LcnSsoSignupResponse body = restClient.post()
					.uri(uri)
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(LcnSsoSignupResponse.class);
			if (body == null || body.getData() == null || body.getData().userId() == null) {
				throw new BadGatewayException("SSO signup returned invalid response (missing data.userId).");
			}
			return body;
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO signup HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			if (e.getStatusCode() == HttpStatus.CONFLICT) {
				throw new ResourceConflictException(extractSsoMessage(responseBody, "SSO signup conflict."));
			}
			throw new BadGatewayException("SSO signup failed: " + e.getMessage(), e);
		}
	}

	public LcnSsoAuthApiResponse login(String baseSsoUrl, String applicationCode, String username, String password) {
		String base = normalizeHttpUrl(baseSsoUrl);
		String uri = base.replaceAll("/$", "") + "/v1/lcn-sso/auth/login";
		Map<String, Object> payload = Map.of(
				"username", username.trim(),
				"password", password);
		try {
			LcnSsoAuthApiResponse body = restClient.post()
					.uri(uri)
					.contentType(MediaType.APPLICATION_JSON)
					.header("X-Application-Code", applicationCode)
					.body(payload)
					.retrieve()
					.body(LcnSsoAuthApiResponse.class);
			if (body == null || body.getData() == null) {
				throw new BadGatewayException("SSO login returned invalid response.");
			}
			return body;
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO login HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
			if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.BAD_REQUEST) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						extractSsoMessage(responseBody, "Invalid email or password."));
			}
			throw new BadGatewayException("SSO login failed: " + e.getMessage(), e);
		}
	}

	public LcnSsoAuthApiResponse verifyOtpAuth(
			String baseSsoUrl,
			String applicationCode,
			String email,
			String otp) {
		String uri = UriComponentsBuilder.fromUriString(authEndpoint(baseSsoUrl, "/v1/lcn-sso/auth/verify/otp"))
				.queryParam("email", email.trim())
				.queryParam("otp", otp.trim())
				.queryParam("applicationCode", applicationCode)
				.toUriString();
		try {
			LcnSsoAuthApiResponse body = restClient.post()
					.uri(uri)
					.retrieve()
					.body(LcnSsoAuthApiResponse.class);
			if (body == null || body.getData() == null) {
				throw new BadGatewayException("SSO verify OTP returned invalid response.");
			}
			return body;
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO verify OTP HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
			if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.BAD_REQUEST) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						extractSsoMessage(responseBody, "Invalid or expired OTP."));
			}
			throw new BadGatewayException("SSO verify OTP failed: " + e.getMessage(), e);
		}
	}

	public void resendOtp(String baseSsoUrl, String email) {
		String uri = UriComponentsBuilder.fromUriString(authEndpoint(baseSsoUrl, "/v1/lcn-sso/auth/resend-otp/email"))
				.queryParam("email", email.trim())
				.toUriString();
		try {
			restClient.post()
					.uri(uri)
					.contentType(MediaType.APPLICATION_FORM_URLENCODED)
					.retrieve()
					.toBodilessEntity();
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO resend OTP HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			throw new BadGatewayException("SSO resend OTP failed: " + e.getMessage(), e);
		}
	}

	public AuthTokenDto refresh(String baseSsoUrl, String applicationCode, String refreshToken) {
		String uri = UriComponentsBuilder.fromUriString(authEndpoint(baseSsoUrl, "/v1/lcn-sso/auth/refresh"))
				.queryParam("refreshToken", refreshToken)
				.toUriString();
		try {
			LcnSsoTokenApiResponse body = restClient.post()
					.uri(uri)
					.header("X-Application-Code", applicationCode)
					.retrieve()
					.body(LcnSsoTokenApiResponse.class);
			if (body == null || body.getData() == null || body.getData().getAccessToken() == null) {
				throw new BadGatewayException("SSO refresh returned invalid response.");
			}
			return body.getData();
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO refresh HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
			if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.BAD_REQUEST) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						extractSsoMessage(responseBody, "Invalid or expired refresh token."));
			}
			throw new BadGatewayException("SSO refresh failed: " + e.getMessage(), e);
		}
	}

	public void changePasswordAuth(String baseSsoUrl, String accessToken, String newPassword) {
		String uri = UriComponentsBuilder.fromUriString(authEndpoint(baseSsoUrl, "/v1/lcn-sso/auth/change-password"))
				.queryParam("accessToken", accessToken)
				.toUriString();
		Map<String, Object> payload = Map.of("newPassword", newPassword);
		try {
			restClient.post()
					.uri(uri)
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.toBodilessEntity();
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO change-password HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
			if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.BAD_REQUEST) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						extractSsoMessage(responseBody, "Unable to change password."));
			}
			throw new BadGatewayException("SSO change-password failed: " + e.getMessage(), e);
		}
	}

	private static String authEndpoint(String baseSsoUrl, String path) {
		return normalizeHttpUrl(baseSsoUrl).replaceAll("/$", "") + path;
	}

	private static String extractSsoMessage(String responseBody, String fallback) {
		if (responseBody == null || responseBody.isBlank()) {
			return fallback;
		}
		String key = "\"message\":\"";
		int start = responseBody.indexOf(key);
		if (start < 0) {
			return fallback;
		}
		int valueStart = start + key.length();
		int end = responseBody.indexOf('"', valueStart);
		if (end <= valueStart) {
			return fallback;
		}
		return responseBody.substring(valueStart, end);
	}

	public LcnSsoCredentialsResponse changeCredentials(String baseSsoUrl, Map<String, Object> payload) {
		String base = normalizeHttpUrl(baseSsoUrl);
		String uri = base.replaceAll("/$", "") + "/v1/lcn-sso/user/change-credentials";
		try {
			LcnSsoChangeCredentialsApiResponse envelope = restClient.post()
					.uri(uri)
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(LcnSsoChangeCredentialsApiResponse.class);
			if (envelope == null || envelope.getData() == null) {
				throw new BadGatewayException("SSO change-credentials returned an empty response.");
			}
			return envelope.getData();
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO change-credentials HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
			if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.BAD_REQUEST) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						extractSsoMessage(responseBody, "Current password is incorrect."));
			}
			if (status == HttpStatus.CONFLICT) {
				throw new ResourceConflictException(extractSsoMessage(responseBody, "Email or username already in use."));
			}
			throw new BadGatewayException("SSO change-credentials failed: " + e.getMessage(), e);
		}
	}

	public LcnSsoUserResponse updateUser(String baseSsoUrl, String authServerUserId, Map<String, Object> payload) {
		String base = normalizeHttpUrl(baseSsoUrl);
		String uri = base.replaceAll("/$", "") + "/v1/lcn-sso/user/update/" + authServerUserId.trim();
		try {
			LcnSsoUpdateUserApiResponse envelope = restClient.put()
					.uri(uri)
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(LcnSsoUpdateUserApiResponse.class);
			if (envelope == null || envelope.getData() == null) {
				throw new BadGatewayException("SSO user update returned an empty response.");
			}
			return envelope.getData();
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO user update HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
			if (status == HttpStatus.CONFLICT) {
				throw new ResourceConflictException(extractSsoMessage(responseBody, "Email or username already in use."));
			}
			if (status == HttpStatus.NOT_FOUND) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND,
						extractSsoMessage(responseBody, "User not found in identity server."));
			}
			throw new BadGatewayException("SSO user update failed: " + e.getMessage(), e);
		}
	}

	public void verifyOtp(String baseSsoUrl, String authServerUserId) {
		String base = normalizeHttpUrl(baseSsoUrl);
		String uri = base.replaceAll("/$", "") + "/v1/lcn-sso/user/" + authServerUserId + "/verify-otp";
		log.info("SSO verify-otp: PATCH {}", uri);
		try {
			restClient.patch().uri(uri).retrieve().toBodilessEntity();
		} catch (RestClientResponseException e) {
			String responseBody = e.getResponseBodyAsString();
			log.error("SSO verify-otp HTTP error: status={} body={}", e.getStatusCode(), responseBody);
			if (e.getStatusCode().value() == 404) {
				throw new ResourceConflictException(
						extractSsoMessage(responseBody, "User not found in identity server."));
			}
			throw new BadGatewayException("SSO verify-otp failed: " + e.getMessage(), e);
		}
	}

	public void deleteUser(String baseSsoUrl, String authServerUserId) {
		String base = normalizeHttpUrl(baseSsoUrl);
		String deleteUrl = base.replaceAll("/$", "") + "/v1/lcn-sso/user/" + authServerUserId;
		log.info("SSO rollback: DELETE {}", deleteUrl);
		try {
			restClient.delete().uri(deleteUrl).retrieve().toBodilessEntity();
		} catch (RestClientResponseException e) {
			if (e.getStatusCode().value() == 404) {
				return;
			}
			log.error("SSO rollback failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
			throw new BadGatewayException("Failed to rollback SSO user: " + e.getMessage(), e);
		}
	}
}
