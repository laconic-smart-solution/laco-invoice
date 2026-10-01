package com.laconic.lacoinvoice.common.pagination;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.common.specification.GenericSpecification;
import com.laconic.lacoinvoice.common.specification.MasterEntitySpecifications;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.validation.SortFieldValidator;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;

public final class PageQuerySupport {

	private PageQuerySupport() {
	}

	public static <E, D> ApiResponse<List<D>> query(
			JpaSpecificationExecutor<E> executor,
			BaseMapper<E, D> mapper,
			PageAndFilterDTO<?> pageAndFilter,
			Class<E> entityClass,
			Object filter,
			Map<String, String> filterFieldToEntityPath) {
		SortFieldValidator.validateSortBy(pageAndFilter.getSortBy(), entityClass);
		Specification<E> spec = MasterEntitySpecifications.restrictToEnabledIfMasterEntity(
				entityClass,
				specification(filter, filterFieldToEntityPath));
		return execute(executor, mapper, pageAndFilter, spec);
	}

	public static <E, D> ApiResponse<List<D>> queryWithMap(
			JpaSpecificationExecutor<E> executor,
			BaseMapper<E, D> mapper,
			PageAndFilterDTO<?> pageAndFilter,
			Class<E> entityClass,
			Map<String, Object> filterMap,
			Specification<E> extraSpec) {
		SortFieldValidator.validateSortBy(pageAndFilter.getSortBy(), entityClass);
		Specification<E> spec = MasterEntitySpecifications.restrictToEnabledIfMasterEntity(entityClass, fromMap(filterMap));
		if (extraSpec != null) {
			spec = spec.and(extraSpec);
		}
		return execute(executor, mapper, pageAndFilter, spec);
	}

	private static <E, D> ApiResponse<List<D>> execute(
			JpaSpecificationExecutor<E> executor,
			BaseMapper<E, D> mapper,
			PageAndFilterDTO<?> pageAndFilter,
			Specification<E> spec) {
		Page<E> page = executor.findAll(spec, pageAndFilter.getPageRequest());
		List<D> data = page.getContent().stream().map(mapper::toDto).toList();
		PageMeta meta = new PageMeta(
				page.getNumber() + 1,
				page.getSize(),
				page.getTotalElements(),
				page.getTotalPages());
		return ApiResponse.ok("OK", data, meta);
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
