package com.laconic.lacoinvoice.features.auth;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.auth.dto.AuthChangePasswordRequest;
import com.laconic.lacoinvoice.features.auth.dto.AuthLoginRequest;
import com.laconic.lacoinvoice.features.auth.dto.AuthResendOtpRequest;
import com.laconic.lacoinvoice.features.auth.dto.AuthSessionDto;
import com.laconic.lacoinvoice.features.auth.dto.AuthVerifyOtpRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Sign in via identity server (sets auth cookies when OTP is verified)")
	public ApiResponse<AuthSessionDto> login(
			@RequestBody @Valid AuthLoginRequest request,
			HttpServletResponse response) {
		return ApiResponse.ok("OK", authService.login(request, response));
	}

	@PostMapping(value = "/verify-otp", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Verify OTP and establish session cookies")
	public ApiResponse<AuthSessionDto> verifyOtp(
			@RequestBody @Valid AuthVerifyOtpRequest request,
			HttpServletResponse response) {
		return ApiResponse.ok("OK", authService.verifyOtp(request, response));
	}

	@PostMapping(value = "/resend-otp", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Resend OTP email")
	public ApiResponse<Void> resendOtp(@RequestBody @Valid AuthResendOtpRequest request) {
		authService.resendOtp(request);
		return ApiResponse.ok("OK");
	}

	@PostMapping(value = "/refresh", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Refresh access token using refresh cookie")
	public ApiResponse<Void> refresh(
			HttpServletRequest request,
			HttpServletResponse response) {
		authService.refresh(request, response, true);
		return ApiResponse.ok("OK");
	}

	@PostMapping(value = "/logout", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Clear auth cookies")
	public ApiResponse<Void> logout(HttpServletResponse response) {
		authService.logout(response);
		return ApiResponse.ok("Logged out");
	}

	@PostMapping(value = "/change-password", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Change password using current access cookie")
	public ApiResponse<Void> changePassword(
			@RequestBody @Valid AuthChangePasswordRequest request,
			HttpServletRequest httpRequest,
			HttpServletResponse response) {
		authService.changePassword(request, httpRequest, response);
		return ApiResponse.ok("Password changed");
	}
}
