package com.laconic.lacoinvoice.features.order.importfile;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;
import com.laconic.lacoinvoice.domain.repositories.OrderImportFileRepository;
import com.laconic.lacoinvoice.features.order.importfile.pageable.OrderImportFilePageRequest;

@Service
public class OrderImportFileService {

	private static final Map<String, String> FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"marketplaceId", "marketplace.id",
			"marketplaceCode", "marketplace.code");

	private final OrderImportFileRepository repository;
	private final OrderImportFileMapper mapper;

	public OrderImportFileService(OrderImportFileRepository repository, OrderImportFileMapper mapper) {
		this.repository = repository;
		this.mapper = mapper;
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<OrderImportFileDto>> page(OrderImportFilePageRequest request) {
		return PageQuerySupport.query(
				repository,
				mapper,
				request.toPageAndFilter(),
				OrderImportFile.class,
				request.getFilter(),
				FILTER_FIELD_PATHS);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderImportFileDto getById(Long id) {
		OrderImportFile entity = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order import file not found: id=" + id));
		return mapper.toDto(entity);
	}
}
