package com.laconic.lacoinvoice.features.store;

import java.util.List;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.common.specification.GenericSpecification;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.validation.SortFieldValidator;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.config.AuthorizationService;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.features.store.StoreCommands.CreateRequest;
import com.laconic.lacoinvoice.features.store.StoreCommands.MarketplaceConnectionCreateRequest;
import com.laconic.lacoinvoice.features.store.StoreCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.store.pageable.StorePageRequest;

@Service
public class StoreServiceImpl implements StoreService {

	private final StoreRepository storeRepository;
	private final StoreMarketplaceConnectionRepository connectionRepository;
	private final MarketplaceRepository marketplaceRepository;
	private final UserRepository userRepository;
	private final StoreMapper mapper;
	private final AuthorizationService authz;

	public StoreServiceImpl(
			StoreRepository storeRepository,
			StoreMarketplaceConnectionRepository connectionRepository,
			MarketplaceRepository marketplaceRepository,
			UserRepository userRepository,
			StoreMapper mapper,
			AuthorizationService authz) {
		this.storeRepository = storeRepository;
		this.connectionRepository = connectionRepository;
		this.marketplaceRepository = marketplaceRepository;
		this.userRepository = userRepository;
		this.mapper = mapper;
		this.authz = authz;
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public StoreDto getById(Long id) {
		Store store = findStoreOrThrow(id);
		verifyStoreOwner(store);
		return mapper.toDto(store);
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<StoreDto> getAll() {
		if (authz.isAdmin()) {
			return storeRepository.findAll().stream().map(mapper::toDto).toList();
		}
		Long ownerId = requireCurrentUserId();
		return storeRepository.findByOwner_Id(ownerId).stream().map(mapper::toDto).toList();
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public StoreDto create(CreateRequest request) {
		Long ownerId = requireCurrentUserId();
		String name = request.getName().trim();
		if (storeRepository.existsByOwner_IdAndNameIgnoreCase(ownerId, name)) {
			throw new ResourceConflictException("Store name already exists for this owner.");
		}

		User owner = userRepository.findById(ownerId)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: id=" + ownerId));

		Store store = new Store();
		store.setOwner(owner);
		store.setName(name);
		store.setLogoUrl(request.getLogoUrl());
		store.setActive(request.getActive() == null || request.getActive());
		return mapper.toDto(storeRepository.save(store));
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public StoreDto update(Long id, UpdateRequest request) {
		Store store = findStoreOrThrow(id);
		verifyStoreOwner(store);

		String name = request.getName().trim();
		Long ownerId = store.getOwner().getId();
		if (!name.equalsIgnoreCase(store.getName())
				&& storeRepository.existsByOwner_IdAndNameIgnoreCase(ownerId, name)) {
			throw new ResourceConflictException("Store name already exists for this owner.");
		}

		store.setName(name);
		store.setLogoUrl(request.getLogoUrl());
		if (request.getActive() != null) {
			store.setActive(request.getActive());
		}
		return mapper.toDto(storeRepository.save(store));
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void delete(Long id) {
		Store store = findStoreOrThrow(id);
		verifyStoreOwner(store);
		store.setActive(false);
		storeRepository.save(store);
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<StoreDto>> page(StorePageRequest request) {
		SortFieldValidator.validateSortBy(request.toPageAndFilter().getSortBy(), Store.class);
		var filterMap = ObjectMapUtils.toMap(request.getFilter());
		if (!authz.isAdmin()) {
			filterMap.put("owner.id", requireCurrentUserId());
		}
		Specification<Store> spec = new GenericSpecification<Store>().getSpecification(
				filterMap,
				filterMap.keySet().stream().toList());
		Page<Store> page = storeRepository.findAll(spec, request.toPageAndFilter().getPageRequest());
		List<StoreDto> data = page.getContent().stream().map(mapper::toDto).toList();
		PageMeta meta = new PageMeta(
				page.getNumber() + 1,
				page.getSize(),
				page.getTotalElements(),
				page.getTotalPages());
		return ApiResponse.ok("OK", data, meta);
	}

	@Override
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public StoreMarketplaceConnectionDto createMarketplaceConnection(
			Long storeId,
			MarketplaceConnectionCreateRequest request) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		Marketplace marketplace = marketplaceRepository.findById(request.getMarketplaceId())
				.orElseThrow(() -> new ResourceNotFoundException(
						"Marketplace not found: id=" + request.getMarketplaceId()));

		StoreMarketplaceConnection connection = new StoreMarketplaceConnection();
		connection.setStore(store);
		connection.setMarketplace(marketplace);
		connection.setAccessToken(request.getAccessToken());
		connection.setRefreshToken(request.getRefreshToken());
		connection.setTokenExpiry(request.getTokenExpiry());
		connection.setStatus(request.getStatus() != null
				? request.getStatus()
				: MarketplaceConnectionStatus.CONNECTED);

		return mapper.toConnectionDto(connectionRepository.save(connection));
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<StoreMarketplaceConnectionDto> listMarketplaceConnections(Long storeId) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);
		return connectionRepository.findByStore_Id(storeId).stream()
				.map(mapper::toConnectionDto)
				.toList();
	}

	private Store findStoreOrThrow(Long id) {
		return storeRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Store not found: id=" + id));
	}

	private void verifyStoreOwner(Store store) {
		if (authz.isAdmin()) {
			return;
		}
		Long currentUserId = requireCurrentUserId();
		Long ownerId = store.getOwner() != null ? store.getOwner().getId() : null;
		if (!Objects.equals(currentUserId, ownerId)) {
			throw new AccessDeniedException("Only the store owner can perform this action.");
		}
	}

	private Long requireCurrentUserId() {
		return AuditUserContext.getCurrentLocalUserId()
				.orElseThrow(() -> new AccessDeniedException("Authenticated user is required."));
	}
}
