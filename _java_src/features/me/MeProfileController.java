package com.laconic.lacoinvoice.features.me;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.me.dto.MeCredentialsRequest;
import com.laconic.lacoinvoice.features.me.dto.MeProfileDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/me")
@Tag(name = "Current user — profile")
public class MeProfileController {

	private final MeProfileService meProfileService;

	public MeProfileController(MeProfileService meProfileService) {
		this.meProfileService = meProfileService;
	}

	@GetMapping(value = "/profile", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Current user's profile")
	public ApiResponse<MeProfileDto> getMyProfile() {
		return ApiResponse.ok("OK", meProfileService.getMyProfile());
	}

	@PutMapping(value = "/credentials", produces = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Change current user's email and/or username (requires current password)")
	public ApiResponse<MeProfileDto> changeMyCredentials(@RequestBody @Valid MeCredentialsRequest request) {
		return ApiResponse.ok("Credentials updated", meProfileService.changeMyCredentials(request));
	}
}
