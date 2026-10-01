package com.laconic.lacoinvoice.integration.sso.dto;

public record LcnSsoUserTokenWithAttributesResponse(
		String userId,
		String email,
		Boolean otpVerified,
		AuthTokenDto token) {
}
