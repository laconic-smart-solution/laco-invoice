package com.laconic.lacoinvoice.features.user;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.user.UserCommands.ChangeCredentialsRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.CreateRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.user.UserCommands.UpdateRoleRequest;
import com.laconic.lacoinvoice.features.user.pageable.UserPageRequest;

import java.util.List;

public interface UserService extends BaseService<UserDto, CreateRequest, UpdateRequest> {

	UserDto getByAuthServerUserId(String authServerUserId);

	ApiResponse<List<UserDto>> page(UserPageRequest request);

	void verifyUserOtp(Long id);

	UserDto changeUserCredentials(Long id, ChangeCredentialsRequest request);

	UserDto updateUserRole(Long id, UpdateRoleRequest request);

	byte[] exportExcel(UserExportRequest request);

	String exportFilename();

	ApiResponse<List<UserDto>> exportPreview(UserExportRequest request);
}
