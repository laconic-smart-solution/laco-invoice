package com.laconic.lacoinvoice.features.product;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.ProductErpStatus;
import com.laconic.lacoinvoice.domain.repositories.ProductErpMappingRepository;

@Component
public class ProductMapper implements BaseMapper<Product, ProductDto> {

	private final ProductErpMappingRepository mappingRepository;

	public ProductMapper(ProductErpMappingRepository mappingRepository) {
		this.mappingRepository = mappingRepository;
	}

	@Override
	public ProductDto toDto(Product entity) {
		if (entity == null) {
			return null;
		}
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		ProductErpStatus erpStatus = mappingRepository.existsByProduct_Id(entity.getId())
				? ProductErpStatus.SYNCED
				: ProductErpStatus.UNMAPPED;
		return new ProductDto(
				entity.getId(),
				storeId,
				entity.getSku(),
				entity.getName(),
				entity.getPrice(),
				erpStatus,
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}
}
