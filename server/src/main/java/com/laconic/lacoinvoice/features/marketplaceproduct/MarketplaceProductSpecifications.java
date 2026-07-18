package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.models.Product;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;

final class MarketplaceProductSpecifications {

	private MarketplaceProductSpecifications() {
	}

	/**
	 * List/filter marketplace products. When {@code storeId} / {@code marketplaceCode} are null,
	 * results are limited to {@code accessibleStoreIds} (owner/admin scope).
	 */
	static Specification<Product> marketplaceList(
			Long storeId,
			String marketplaceCode,
			String search,
			BigDecimal priceMin,
			BigDecimal priceMax,
			String erpStatus,
			Collection<Long> accessibleStoreIds) {
		return (root, query, cb) -> {
			var predicates = new java.util.ArrayList<Predicate>();
			predicates.add(cb.isNotNull(root.get("marketplaceCode")));

			if (storeId != null) {
				predicates.add(cb.equal(root.get("store").get("id"), storeId));
			} else if (accessibleStoreIds != null && !accessibleStoreIds.isEmpty()) {
				predicates.add(root.get("store").get("id").in(accessibleStoreIds));
			} else if (accessibleStoreIds != null) {
				predicates.add(cb.disjunction());
			}

			if (StringUtils.hasText(marketplaceCode)) {
				predicates.add(cb.equal(
						cb.upper(root.get("marketplaceCode")),
						marketplaceCode.trim().toUpperCase()));
			}

			if (StringUtils.hasText(search)) {
				String pattern = "%" + search.trim().toLowerCase() + "%";
				predicates.add(cb.or(
						cb.like(cb.lower(root.get("name")), pattern),
						cb.like(cb.lower(root.get("sku")), pattern),
						cb.like(cb.lower(root.get("externalProductId")), pattern)));
			}
			if (priceMin != null) {
				predicates.add(cb.greaterThanOrEqualTo(root.get("price"), priceMin));
			}
			if (priceMax != null) {
				predicates.add(cb.lessThanOrEqualTo(root.get("price"), priceMax));
			}
			if (StringUtils.hasText(erpStatus) && !"all".equalsIgnoreCase(erpStatus)) {
				if ("synced".equalsIgnoreCase(erpStatus)) {
					predicates.add(cb.exists(erpMappingExists(root, query, cb)));
				} else if ("unmapped".equalsIgnoreCase(erpStatus)) {
					predicates.add(cb.not(cb.exists(erpMappingExists(root, query, cb))));
				}
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}

	/** Backward-compatible overload for required store + marketplace list. */
	static Specification<Product> marketplaceList(
			Long storeId,
			String marketplaceCode,
			String search,
			BigDecimal priceMin,
			BigDecimal priceMax,
			String erpStatus) {
		return marketplaceList(
				storeId,
				marketplaceCode,
				search,
				priceMin,
				priceMax,
				erpStatus,
				storeId != null ? List.of(storeId) : List.of());
	}

	private static Subquery<Long> erpMappingExists(
			jakarta.persistence.criteria.Root<Product> root,
			jakarta.persistence.criteria.CriteriaQuery<?> query,
			jakarta.persistence.criteria.CriteriaBuilder cb) {
		Subquery<Long> subquery = query.subquery(Long.class);
		var mappingRoot = subquery.from(com.laconic.lacoinvoice.domain.models.ProductErpMapping.class);
		subquery.select(mappingRoot.get("id"));
		subquery.where(
				cb.equal(mappingRoot.get("product").get("id"), root.get("id")),
				cb.isTrue(mappingRoot.get("isEnable")));
		return subquery;
	}
}
