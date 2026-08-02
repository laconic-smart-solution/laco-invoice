package com.laconic.lacoinvoice.features.user;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.BaseCrudController;
import com.laconic.lacoinvoice.features.user.UserCommands.ChangeCredentialsRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.CreateRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.UpdateRoleRequest;
import com.laconic.lacoinvoice.features.user.pageable.UserPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users")
public class UserController extends BaseCrudController<UserDto, CreateRequest, UpdateRequest> {

	private static final MediaType XLSX = MediaType.parseMediaType(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

	private final UserService service;

	public UserController(UserService service) {
		this.service = service;
	}

	@Override
	protected BaseService<UserDto, CreateRequest, UpdateRequest> service() {
		return service;
	}

	@GetMapping("/auth/{authServerUserId}")
	@Operation(summary = "Get user by auth-server user id")
	public ApiResponse<UserDto> getByAuthServerUserId(@PathVariable String authServerUserId) {
		return ApiResponse.ok("OK", service.getByAuthServerUserId(authServerUserId));
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated user search")
	public ApiResponse<List<UserDto>> pageable(@RequestBody @Valid UserPageRequest request) {
		return service.page(request);
	}

	@PostMapping("/export")
	@Operation(summary = "Export users to Excel (selected IDs or all matching filter)")
	public ResponseEntity<byte[]> export(@RequestBody UserExportRequest request) {
		byte[] body = service.exportExcel(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename() + "\"")
				.contentType(XLSX)
				.body(body);
	}

	@PostMapping("/export/preview")
	@Operation(summary = "Paginated preview of users that will be exported")
	public ApiResponse<List<UserDto>> exportPreview(@RequestBody UserExportRequest request) {
		return service.exportPreview(request);
	}

	@PostMapping("/{id}/verify-otp")
	@Operation(summary = "Verify user OTP in identity server")
	public ApiResponse<Void> verifyUserOtp(@PathVariable Long id) {
		service.verifyUserOtp(id);
		return ApiResponse.ok("User OTP verified");
	}

	@PutMapping("/{id}/credentials")
	@Operation(summary = "Admin update of user email/username in identity server")
	public ApiResponse<UserDto> changeUserCredentials(
			@PathVariable Long id,
			@RequestBody @Valid ChangeCredentialsRequest request) {
		return ApiResponse.ok("Credentials updated", service.changeUserCredentials(id, request));
	}

	@PatchMapping("/{id}/role")
	@Operation(summary = "Update user role")
	public ApiResponse<UserDto> updateUserRole(
			@PathVariable Long id,
			@RequestBody @Valid UpdateRoleRequest request) {
		return ApiResponse.ok("Role updated", service.updateUserRole(id, request));
	}
}
