package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.util.List;
import java.util.Optional;

import com.laconic.lacoinvoice.domain.models.ErpItem;
import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.ProductErpMapping;
import com.laconic.lacoinvoice.domain.repositories.ProductErpMappingRepository;

final class MarketplaceProductErpSupport {

	private MarketplaceProductErpSupport() {
	}

	static MarketplaceProductErpDetailDto fromProduct(
			Product product,
			ProductErpMappingRepository mappingRepository) {
		if (product == null || product.getId() == null) {
			return unmapped();
		}
		List<ProductErpMapping> mappings = mappingRepository.findByProduct_Id(product.getId());
		if (mappings.isEmpty()) {
			return unmapped();
		}
		ProductErpMapping mapping = mappings.getFirst();
		ErpItem erpItem = mapping.getErpItem();
		return new MarketplaceProductErpDetailDto(
				"SYNCED",
				product.getId(),
				erpItem != null ? erpItem.getId() : null,
				erpItem != null ? erpItem.getErpCode() : product.getSku(),
				erpItem != null ? erpItem.getName() : null,
				mapping.getUpdatedAt());
	}

	static String erpStatusLabel(Product product, ProductErpMappingRepository mappingRepository) {
		return fromProduct(product, mappingRepository).status();
	}

	private static MarketplaceProductErpDetailDto unmapped() {
		return new MarketplaceProductErpDetailDto(
				"UNMAPPED",
				null,
				null,
				null,
				null,
				null);
	}
}
