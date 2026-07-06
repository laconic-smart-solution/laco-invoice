package com.laconic.lacoinvoice.features.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.service.BaseServiceImpl;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.repositories.ProductRepository;
import com.laconic.lacoinvoice.features.product.ProductCommands.CreateRequest;
import com.laconic.lacoinvoice.features.product.ProductCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.product.pageable.ProductPageRequest;

@Service
public class ProductServiceImpl extends BaseServiceImpl<Product, ProductDto, CreateRequest, UpdateRequest>
		implements ProductService {

	private final ProductRepository repository;
	private final ProductMapper mapper;

	public ProductServiceImpl(ProductRepository repository, ProductMapper mapper) {
		this.repository = repository;
		this.mapper = mapper;
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<ProductDto>> page(ProductPageRequest request) {
		return PageQuerySupport.queryWithMap(
				repository,
				mapper,
				request.toPageAndFilter(),
				Product.class,
				ObjectMapUtils.toMap(request.getFilter()),
				null);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ProductDto getById(Long id) {
		return super.getById(id);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<ProductDto> getAll() {
		return super.getAll();
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ProductDto create(CreateRequest request) {
		return super.create(request);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ProductDto update(Long id, UpdateRequest request) {
		return super.update(id, request);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void delete(Long id) {
		super.delete(id);
	}

	@Override
	protected JpaRepository<Product, Long> repository() {
		return repository;
	}

	@Override
	protected BaseMapper<Product, ProductDto> mapper() {
		return mapper;
	}

	@Override
	protected Product createEntity(CreateRequest request) {
		String sku = request.getSku().trim();
		Product entity = new Product();
		entity.setSku(sku);
		entity.setName(request.getName().trim());
		entity.setPrice(request.getPrice());
		return entity;
	}

	@Override
	protected void updateEntity(Product entity, UpdateRequest request) {
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		String sku = request.getSku().trim();
		if (storeId != null
				&& !sku.equalsIgnoreCase(entity.getSku())
				&& repository.existsByStore_IdAndSkuIgnoreCaseAndIdNot(storeId, sku, entity.getId())) {
			throw new ResourceConflictException("SKU already exists for this store.");
		}
		entity.setSku(sku);
		entity.setName(request.getName().trim());
		entity.setPrice(request.getPrice());
	}
}
