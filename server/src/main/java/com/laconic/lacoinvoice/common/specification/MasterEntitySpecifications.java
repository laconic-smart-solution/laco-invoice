package com.laconic.lacoinvoice.common.specification;

import org.springframework.data.jpa.domain.Specification;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

public final class MasterEntitySpecifications {

	private MasterEntitySpecifications() {
	}

	public static <T extends MasterEntity> Specification<T> isEnabled() {
		return (root, query, cb) -> cb.isTrue(root.get("isEnable"));
	}

	@SuppressWarnings("unchecked")
	public static <E> Specification<E> restrictToEnabledIfMasterEntity(Class<?> entityClass, Specification<E> spec) {
		if (entityClass == null || !MasterEntity.class.isAssignableFrom(entityClass)) {
			return spec;
		}
		Specification<E> enabled = (Specification<E>) isEnabled();
		return spec.and(enabled);
	}
}
