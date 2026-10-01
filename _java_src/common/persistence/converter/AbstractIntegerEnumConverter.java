package com.laconic.lacoinvoice.common.persistence.converter;

import com.laconic.lacoinvoice.common.persistence.PersistableEnum;

import jakarta.persistence.AttributeConverter;

public abstract class AbstractIntegerEnumConverter<E extends Enum<E> & PersistableEnum>
		implements AttributeConverter<E, Integer> {

	private final Class<E> enumType;

	protected AbstractIntegerEnumConverter(Class<E> enumType) {
		this.enumType = enumType;
	}

	@Override
	public Integer convertToDatabaseColumn(E attribute) {
		return attribute == null ? null : attribute.getCode();
	}

	@Override
	public E convertToEntityAttribute(Integer dbData) {
		if (dbData == null) {
			return null;
		}
		for (E constant : enumType.getEnumConstants()) {
			if (constant.getCode() == dbData) {
				return constant;
			}
		}
		throw new IllegalArgumentException(
				"Unknown " + enumType.getSimpleName() + " code: " + dbData);
	}
}
