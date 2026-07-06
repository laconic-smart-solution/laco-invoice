package com.laconic.lacoinvoice.common.util;

import java.lang.reflect.Field;
import java.util.LinkedHashMap;
import java.util.Map;

public final class ObjectMapUtils {

	private ObjectMapUtils() {
	}

	public static Map<String, Object> toMap(Object obj) {
		if (obj == null) {
			return Map.of();
		}
		Map<String, Object> result = new LinkedHashMap<>();
		for (Field field : obj.getClass().getDeclaredFields()) {
			field.setAccessible(true);
			try {
				Object value = field.get(obj);
				if (value != null) {
					result.put(field.getName(), value);
				}
			} catch (IllegalAccessException ignored) {
				// skip
			}
		}
		return result;
	}

	public static Map<String, Object> toMap(Object obj, Map<String, String> filterFieldToEntityField) {
		if (obj == null) {
			return Map.of();
		}
		Map<String, Object> result = new LinkedHashMap<>();
		for (Field field : obj.getClass().getDeclaredFields()) {
			field.setAccessible(true);
			try {
				Object value = field.get(obj);
				if (value != null) {
					String fieldName = field.getName();
					String mapped = filterFieldToEntityField != null && filterFieldToEntityField.containsKey(fieldName)
							? filterFieldToEntityField.get(fieldName)
							: fieldName;
					result.put(mapped, value);
				}
			} catch (IllegalAccessException ignored) {
				// skip
			}
		}
		return result;
	}
}
