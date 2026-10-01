package com.laconic.lacoinvoice.features.user;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.User;

@Component
public class UserMapper implements BaseMapper<User, UserDto> {

	@Override
	public UserDto toDto(User entity) {
		if (entity == null) {
			return null;
		}
		UserDto dto = new UserDto();
		dto.setId(entity.getId());
		dto.setCreatedAt(entity.getCreatedAt());
		dto.setUpdatedAt(entity.getUpdatedAt());
		dto.setEmail(entity.getEmail());
		dto.setAuthServerUserId(entity.getAuthServerUserId());
		dto.setFullName(entity.getFullName());
		dto.setRole(entity.getRole());
		dto.setActive(entity.isActive());
		return dto;
	}
}
