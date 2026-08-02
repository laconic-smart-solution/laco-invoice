package com.laconic.lacoinvoice.common.pagination;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.specification.GenericSpecification;
import com.laconic.lacoinvoice.common.specification.MasterEntitySpecifications;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;

public final class SpecQuerySupport {

	private SpecQuerySupport() {
	}

	public static <E> List<E> findAll(
			JpaSpecificationExecutor<E> executor,
			Class<E> entityClass,
			Object filter,
			Map<String, String> filterFieldToEntityPath,
			int maxRows,
			String tooManyMessage) {
		Specification<E> spec = MasterEntitySpecifications.restrictToEnabledIfMasterEntity(
				entityClass,
				specification(filter, filterFieldToEntityPath));
		long count = executor.count(spec);
		if (count > maxRows) {
			throw new BusinessRuleException(tooManyMessage);
		}
		return executor.findAll(spec);
	}

	public static <E> List<E> findAllWithMap(
			JpaSpecificationExecutor<E> executor,
			Class<E> entityClass,
			Map<String, Object> filterMap,
			int maxRows,
			String tooManyMessage) {
		Specification<E> spec = MasterEntitySpecifications.restrictToEnabledIfMasterEntity(
				entityClass,
				fromMap(filterMap));
		long count = executor.count(spec);
		if (count > maxRows) {
			throw new BusinessRuleException(tooManyMessage);
		}
		return executor.findAll(spec);
	}

	private static <T> Specification<T> specification(Object filter, Map<String, String> filterFieldToEntityPath) {
		if (filter == null) {
			return (root, q, cb) -> cb.conjunction();
		}
		Map<String, Object> map = filterFieldToEntityPath != null && !filterFieldToEntityPath.isEmpty()
				? ObjectMapUtils.toMap(filter, filterFieldToEntityPath)
				: ObjectMapUtils.toMap(filter);
		return fromMap(map);
	}

	private static <T> Specification<T> fromMap(Map<String, Object> map) {
		if (map == null || map.isEmpty()) {
			return (root, q, cb) -> cb.conjunction();
		}
		List<String> fields = new ArrayList<>(map.keySet());
		return new GenericSpecification<T>().getSpecification(map, fields);
	}
}
