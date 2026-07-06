package com.laconic.lacoinvoice.features.erp;

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
import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.ProductErpMapping;
import com.laconic.lacoinvoice.domain.repositories.ErpItemRepository;
import com.laconic.lacoinvoice.domain.repositories.ProductErpMappingRepository;
import com.laconic.lacoinvoice.domain.repositories.ProductRepository;
import com.laconic.lacoinvoice.features.erp.ErpItemCommands.CreateRequest;
import com.laconic.lacoinvoice.features.erp.ErpItemCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.erp.pageable.ErpItemPageRequest;

@Service
public class ErpItemServiceImpl extends BaseServiceImpl<ErpItem, ErpItemDto, CreateRequest, UpdateRequest>
		implements ErpItemService {

	private final ErpItemRepository repository;
	private final ErpItemMapper mapper;
	private final ProductRepository productRepository;
	private final ProductErpMappingRepository mappingRepository;

	public ErpItemServiceImpl(
			ErpItemRepository repository,
			ErpItemMapper mapper,
			ProductRepository productRepository,
			ProductErpMappingRepository mappingRepository) {
		this.repository = repository;
		this.mapper = mapper;
		this.productRepository = productRepository;
		this.mappingRepository = mappingRepository;
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<ErpItemDto>> page(ErpItemPageRequest request) {
		return PageQuerySupport.queryWithMap(
				repository,
				mapper,
				request.toPageAndFilter(),
				ErpItem.class,
				ObjectMapUtils.toMap(request.getFilter()),
				null);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpItemDto getById(Long id) {
		return super.getById(id);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<ErpItemDto> getAll() {
		return super.getAll();
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpItemDto create(CreateRequest request) {
		return super.create(request);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpItemDto update(Long id, UpdateRequest request) {
		return super.update(id, request);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void delete(Long id) {
		super.delete(id);
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void createProductMapping(Long productId, ErpMappingRequest request) {
		Product product = findProduct(productId);
		ErpItem erpItem = repository.findById(request.getErpItemId())
				.orElseThrow(() -> new ResourceNotFoundException("ERP item not found: id=" + request.getErpItemId()));

		ProductErpMapping mapping = new ProductErpMapping();
		mapping.setProduct(product);
		mapping.setErpItem(erpItem);
		mappingRepository.save(mapping);
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void deleteProductMapping(Long productId, Long mappingId) {
		findProduct(productId);
		ProductErpMapping mapping = mappingRepository.findByProduct_IdAndId(productId, mappingId)
				.orElseThrow(() -> new ResourceNotFoundException("ERP mapping not found: id=" + mappingId));
		mapping.delete();
		mappingRepository.save(mapping);
	}

	private Product findProduct(Long productId) {
		return productRepository.findById(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found: id=" + productId));
	}

	@Override
	protected JpaRepository<ErpItem, Long> repository() {
		return repository;
	}

	@Override
	protected BaseMapper<ErpItem, ErpItemDto> mapper() {
		return mapper;
	}

	@Override
	protected ErpItem createEntity(CreateRequest request) {
		String erpCode = request.getErpCode().trim();
		if (repository.existsByErpCodeIgnoreCase(erpCode)) {
			throw new ResourceConflictException("ERP code already exists.");
		}
		ErpItem entity = new ErpItem();
		entity.setErpCode(erpCode);
		entity.setName(request.getName().trim());
		entity.setDescription(request.getDescription());
		return entity;
	}

	@Override
	protected void updateEntity(ErpItem entity, UpdateRequest request) {
		String erpCode = request.getErpCode().trim();
		if (!erpCode.equalsIgnoreCase(entity.getErpCode())
				&& repository.existsByErpCodeIgnoreCaseAndIdNot(erpCode, entity.getId())) {
			throw new ResourceConflictException("ERP code already exists.");
		}
		entity.setErpCode(erpCode);
		entity.setName(request.getName().trim());
		entity.setDescription(request.getDescription());
	}
}
