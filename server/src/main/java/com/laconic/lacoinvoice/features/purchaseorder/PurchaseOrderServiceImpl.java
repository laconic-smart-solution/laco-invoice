package com.laconic.lacoinvoice.features.purchaseorder;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.service.BaseServiceImpl;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.ErpItem;
import com.laconic.lacoinvoice.domain.models.PurchaseOrder;
import com.laconic.lacoinvoice.domain.models.PurchaseOrderItem;
import com.laconic.lacoinvoice.domain.models.PurchaseOrderStatus;
import com.laconic.lacoinvoice.domain.repositories.ErpItemRepository;
import com.laconic.lacoinvoice.domain.repositories.PurchaseOrderItemRepository;
import com.laconic.lacoinvoice.domain.repositories.PurchaseOrderRepository;
import com.laconic.lacoinvoice.features.purchaseorder.PurchaseOrderCommands.CreateRequest;
import com.laconic.lacoinvoice.features.purchaseorder.PurchaseOrderCommands.ItemRequest;
import com.laconic.lacoinvoice.features.purchaseorder.PurchaseOrderCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.purchaseorder.pageable.PurchaseOrderPageRequest;

@Service
public class PurchaseOrderServiceImpl
		extends BaseServiceImpl<PurchaseOrder, PurchaseOrderDto, CreateRequest, UpdateRequest>
		implements PurchaseOrderService {

	private final PurchaseOrderRepository repository;
	private final PurchaseOrderItemRepository itemRepository;
	private final ErpItemRepository erpItemRepository;
	private final PurchaseOrderMapper mapper;

	public PurchaseOrderServiceImpl(
			PurchaseOrderRepository repository,
			PurchaseOrderItemRepository itemRepository,
			ErpItemRepository erpItemRepository,
			PurchaseOrderMapper mapper) {
		this.repository = repository;
		this.itemRepository = itemRepository;
		this.erpItemRepository = erpItemRepository;
		this.mapper = mapper;
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<PurchaseOrderDto>> page(PurchaseOrderPageRequest request) {
		return PageQuerySupport.queryWithMap(
				repository,
				mapper,
				request.toPageAndFilter(),
				PurchaseOrder.class,
				ObjectMapUtils.toMap(request.getFilter()),
				null);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public PurchaseOrderDto getById(Long id) {
		return super.getById(id);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<PurchaseOrderDto> getAll() {
		return super.getAll();
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public PurchaseOrderDto create(CreateRequest request) {
		return super.create(request);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public PurchaseOrderDto update(Long id, UpdateRequest request) {
		PurchaseOrder entity = repository.findById(id).orElseThrow(() -> notFound(id));
		updateEntity(entity, request);
		replaceItems(entity, request.getItems());
		return mapper.toDto(repository.save(entity));
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void delete(Long id) {
		super.delete(id);
	}

	@Override
	protected JpaRepository<PurchaseOrder, Long> repository() {
		return repository;
	}

	@Override
	protected BaseMapper<PurchaseOrder, PurchaseOrderDto> mapper() {
		return mapper;
	}

	@Override
	protected PurchaseOrder createEntity(CreateRequest request) {
		String poNumber = request.getPoNumber().trim();
		if (repository.existsByPoNumberIgnoreCase(poNumber)) {
			throw new ResourceConflictException("PO number already exists.");
		}
		PurchaseOrder entity = new PurchaseOrder();
		entity.setPoNumber(poNumber);
		entity.setStatus(request.getStatus() != null ? request.getStatus() : PurchaseOrderStatus.DRAFT);
		PurchaseOrder saved = repository.save(entity);
		replaceItems(saved, request.getItems());
		return saved;
	}

	@Override
	protected void updateEntity(PurchaseOrder entity, UpdateRequest request) {
		String poNumber = request.getPoNumber().trim();
		if (!poNumber.equalsIgnoreCase(entity.getPoNumber())
				&& repository.existsByPoNumberIgnoreCaseAndIdNot(poNumber, entity.getId())) {
			throw new ResourceConflictException("PO number already exists.");
		}
		entity.setPoNumber(poNumber);
		if (request.getStatus() != null) {
			entity.setStatus(request.getStatus());
		}
	}

	private void replaceItems(PurchaseOrder purchaseOrder, List<ItemRequest> items) {
		itemRepository.deleteByPurchaseOrder_Id(purchaseOrder.getId());
		for (ItemRequest itemRequest : items) {
			ErpItem erpItem = erpItemRepository.findById(itemRequest.getErpItemId())
					.orElseThrow(() -> new ResourceNotFoundException(
							"ERP item not found: id=" + itemRequest.getErpItemId()));
			PurchaseOrderItem item = new PurchaseOrderItem();
			item.setPurchaseOrder(purchaseOrder);
			item.setErpItem(erpItem);
			item.setQuantity(itemRequest.getQuantity());
			item.setUnitPrice(itemRequest.getUnitPrice());
			itemRepository.save(item);
		}
	}
}
