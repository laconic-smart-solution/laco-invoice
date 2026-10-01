package com.laconic.lacoinvoice.features.customer;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;

@Component
public class CustomerMapper implements BaseMapper<CustomerInfo, CustomerDto> {

	@Override
	public CustomerDto toDto(CustomerInfo entity) {
		if (entity == null) {
			return null;
		}
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		String storeName = entity.getStore() != null ? entity.getStore().getName() : null;
		Long marketplaceId = entity.getMarketplace() != null ? entity.getMarketplace().getId() : null;
		String marketplaceCode = entity.getMarketplace() != null ? entity.getMarketplace().getCode() : null;
		return new CustomerDto(
				entity.getId(),
				storeId,
				storeName,
				marketplaceId,
				marketplaceCode,
				entity.getExternalCustomerId(),
				entity.getName(),
				entity.getEmail(),
				entity.getPhone(),
				entity.getGender(),
				entity.getAddress(),
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}
}
