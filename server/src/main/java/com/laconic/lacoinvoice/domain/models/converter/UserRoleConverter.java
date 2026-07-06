package com.laconic.lacoinvoice.domain.models.converter;

import com.laconic.lacoinvoice.common.persistence.converter.AbstractIntegerEnumConverter;
import com.laconic.lacoinvoice.domain.models.UserRole;

import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class UserRoleConverter extends AbstractIntegerEnumConverter<UserRole> {

	public UserRoleConverter() {
		super(UserRole.class);
	}
}
