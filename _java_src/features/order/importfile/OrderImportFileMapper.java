package com.laconic.lacoinvoice.features.order.importfile;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;

@Component
public class OrderImportFileMapper implements BaseMapper<OrderImportFile, OrderImportFileDto> {

	@Override
	public OrderImportFileDto toDto(OrderImportFile entity) {
		if (entity == null) {
			return null;
		}
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		String storeName = entity.getStore() != null ? entity.getStore().getName() : null;
		Long marketplaceId = entity.getMarketplace() != null ? entity.getMarketplace().getId() : null;
		String marketplaceCode = entity.getMarketplace() != null ? entity.getMarketplace().getCode() : null;
		return new OrderImportFileDto(
				entity.getId(),
				storeId,
				storeName,
				marketplaceId,
				marketplaceCode,
				entity.getOriginalFilename(),
				entity.getSheetName(),
				entity.getRowCount(),
				entity.getImportedOrders(),
				entity.getImportedItems(),
				entity.getStatus(),
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}
}
