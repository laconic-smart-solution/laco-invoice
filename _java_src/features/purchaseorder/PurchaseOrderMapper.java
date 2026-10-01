package com.laconic.lacoinvoice.features.purchaseorder;

import java.util.List;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.PurchaseOrder;
import com.laconic.lacoinvoice.domain.models.PurchaseOrderItem;
import com.laconic.lacoinvoice.domain.repositories.PurchaseOrderItemRepository;

@Component
public class PurchaseOrderMapper implements BaseMapper<PurchaseOrder, PurchaseOrderDto> {

	private final PurchaseOrderItemRepository itemRepository;

	public PurchaseOrderMapper(PurchaseOrderItemRepository itemRepository) {
		this.itemRepository = itemRepository;
	}

	@Override
	public PurchaseOrderDto toDto(PurchaseOrder entity) {
		if (entity == null) {
			return null;
		}
		List<PurchaseOrderItemDto> items = itemRepository.findByPurchaseOrder_Id(entity.getId()).stream()
				.map(this::toItemDto)
				.toList();
		return new PurchaseOrderDto(
				entity.getId(),
				entity.getPoNumber(),
				entity.getStatus(),
				entity.getCreatedAt(),
				entity.getUpdatedAt(),
				items);
	}

	public PurchaseOrderItemDto toItemDto(PurchaseOrderItem entity) {
		if (entity == null) {
			return null;
		}
		Long erpItemId = entity.getErpItem() != null ? entity.getErpItem().getId() : null;
		String erpCode = entity.getErpItem() != null ? entity.getErpItem().getErpCode() : null;
		String erpItemName = entity.getErpItem() != null ? entity.getErpItem().getName() : null;
		return new PurchaseOrderItemDto(
				entity.getId(),
				erpItemId,
				erpCode,
				erpItemName,
				entity.getQuantity(),
				entity.getUnitPrice());
	}
}
