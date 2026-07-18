package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.SortOrder;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.config.AuthorizationService;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncRun;
import com.laconic.lacoinvoice.domain.models.MarketplaceProductSyncStatus;
import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceProductSyncRunRepository;
import com.laconic.lacoinvoice.domain.repositories.ProductErpMappingRepository;
import com.laconic.lacoinvoice.domain.repositories.ProductRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.marketplaceproduct.pageable.MarketplaceProductFilter;
import com.laconic.lacoinvoice.features.marketplaceproduct.pageable.MarketplaceProductPageRequest;

@Service
public class MarketplaceProductService {

	private static final java.util.Set<String> ALLOWED_SORT_FIELDS = java.util.Set.of(
			"updatedAt",
			"price",
			"name",
			"sku",
			"externalProductId");

	private final StoreRepository storeRepository;
	private final StoreMarketplaceConnectionRepository connectionRepository;
	private final ProductRepository productRepository;
	private final ProductErpMappingRepository mappingRepository;
	private final MarketplaceProductSyncRunRepository syncRunRepository;
	private final AuthorizationService authz;

	public MarketplaceProductService(
			StoreRepository storeRepository,
			StoreMarketplaceConnectionRepository connectionRepository,
			ProductRepository productRepository,
			ProductErpMappingRepository mappingRepository,
			MarketplaceProductSyncRunRepository syncRunRepository,
			AuthorizationService authz) {
		this.storeRepository = storeRepository;
		this.connectionRepository = connectionRepository;
		this.productRepository = productRepository;
		this.mappingRepository = mappingRepository;
		this.syncRunRepository = syncRunRepository;
		this.authz = authz;
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<MarketplaceProductSourceDto> listSources() {
		List<Store> stores = resolveAccessibleStores();
		List<MarketplaceProductSourceDto> sources = new ArrayList<>();

		for (Store store : stores) {
			List<StoreMarketplaceConnection> connections = connectionRepository.findByStore_Id(store.getId());
			for (StoreMarketplaceConnection connection : connections) {
				if (connection.getStatus() != MarketplaceConnectionStatus.CONNECTED) {
					continue;
				}
				Marketplace marketplace = connection.getMarketplace();
				if (marketplace == null || !StringUtils.hasText(marketplace.getCode())) {
					continue;
				}
				if (!StringUtils.hasText(connection.getAccessToken())) {
					continue;
				}
				String marketplaceCode = marketplace.getCode().toUpperCase();
				String marketplaceName = marketplace.getName() != null ? marketplace.getName() : marketplaceCode;
				String country = connection.getExternalCountry() != null
						? connection.getExternalCountry().toUpperCase()
						: "";
				String display = connection.getDisplayName() != null ? connection.getDisplayName().trim() : "";
				String label = buildSourceLabel(store.getName(), marketplaceName, display, country);
				MarketplaceProductSyncRun latestSync = syncRunRepository
						.findFirstByStoreIdAndMarketplaceCodeIgnoreCaseOrderByStartedAtDesc(store.getId(), marketplaceCode)
						.orElse(null);
				sources.add(new MarketplaceProductSourceDto(
						store.getId(),
						store.getName(),
						marketplaceCode,
						marketplaceName,
						connection.getExternalConnectionId(),
						label,
						country,
						latestSync != null ? latestSync.getCompletedAt() != null
								? latestSync.getCompletedAt()
								: latestSync.getStartedAt() : null,
						latestSync != null ? latestSync.getStatus().name() : null));
			}
		}

		sources.sort(Comparator.comparing(MarketplaceProductSourceDto::label, String.CASE_INSENSITIVE_ORDER));
		return sources;
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public MarketplaceProductPageResult listProducts(
			Long storeId,
			String marketplaceCode,
			int page,
			int limit,
			String search,
			BigDecimal priceMin,
			BigDecimal priceMax,
			String erpStatus) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);
		verifyConnectedSource(storeId, marketplaceCode);

		String normalizedCode = marketplaceCode.toUpperCase();
		String marketplaceName = resolveMarketplaceName(storeId, normalizedCode);

		int safePage = page < 1 ? 1 : page;
		int safeLimit = limit < 1 ? 20 : Math.min(limit, 100);
		PageRequest pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "updatedAt"));

		Page<Product> productPage = productRepository.findAll(
				MarketplaceProductSpecifications.marketplaceList(
						storeId,
						normalizedCode,
						search,
						priceMin,
						priceMax,
						erpStatus),
				pageable);

		List<MarketplaceProductDto> items = productPage.getContent().stream()
				.map(product -> toListDto(product, store, normalizedCode, marketplaceName))
				.toList();

		PageMeta meta = new PageMeta(
				productPage.getNumber() + 1,
				productPage.getSize(),
				productPage.getTotalElements(),
				productPage.getTotalPages());
		return new MarketplaceProductPageResult(items, meta);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<MarketplaceProductDto>> page(MarketplaceProductPageRequest request) {
		MarketplaceProductFilter filter = request.getFilter() != null
				? request.getFilter()
				: new MarketplaceProductFilter();

		Long storeId = filter.getStoreId();
		String marketplaceCode = StringUtils.hasText(filter.getMarketplaceCode())
				? filter.getMarketplaceCode().trim().toUpperCase()
				: null;

		List<Store> accessibleStores = resolveAccessibleStores();
		List<Long> accessibleStoreIds = accessibleStores.stream()
				.map(Store::getId)
				.filter(Objects::nonNull)
				.toList();

		if (storeId != null) {
			Store store = findStoreOrThrow(storeId);
			verifyStoreOwner(store);
			if (marketplaceCode != null) {
				verifyConnectedSource(storeId, marketplaceCode);
			}
		}

		int safePage = Math.max(request.getPageNumber(), 1);
		int safeSize = Math.min(Math.max(request.getPageSize(), 1), 500);
		PageRequest pageable = resolvePageRequest(safePage, safeSize, request.getSortBy(), request.getSortOrder());

		Page<Product> productPage = productRepository.findAll(
				MarketplaceProductSpecifications.marketplaceList(
						storeId,
						marketplaceCode,
						filter.getSearch(),
						filter.getPriceMin(),
						filter.getPriceMax(),
						filter.getErpStatus(),
						accessibleStoreIds),
				pageable);

		java.util.Map<Long, Store> storeById = accessibleStores.stream()
				.filter(store -> store.getId() != null)
				.collect(java.util.stream.Collectors.toMap(Store::getId, store -> store, (a, b) -> a));

		List<MarketplaceProductDto> items = productPage.getContent().stream()
				.map(product -> {
					Store store = product.getStore();
					Long resolvedStoreId = store != null ? store.getId() : null;
					Store resolvedStore = resolvedStoreId != null
							? storeById.getOrDefault(resolvedStoreId, store)
							: store;
					String code = StringUtils.hasText(product.getMarketplaceCode())
							? product.getMarketplaceCode().toUpperCase()
							: "";
					String marketplaceName = resolvedStoreId != null && StringUtils.hasText(code)
							? resolveMarketplaceName(resolvedStoreId, code)
							: code;
					return toListDto(
							product,
							resolvedStore != null ? resolvedStore : store,
							code,
							marketplaceName);
				})
				.toList();

		PageMeta meta = new PageMeta(
				productPage.getNumber() + 1,
				productPage.getSize(),
				productPage.getTotalElements(),
				productPage.getTotalPages());
		return ApiResponse.ok("OK", items, meta);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public MarketplaceProductStatsDto stats(Long storeId, String marketplaceCode) {
		String normalizedCode = StringUtils.hasText(marketplaceCode)
				? marketplaceCode.trim().toUpperCase()
				: null;

		List<Store> accessibleStores = resolveAccessibleStores();
		List<Long> accessibleStoreIds = accessibleStores.stream()
				.map(Store::getId)
				.filter(Objects::nonNull)
				.toList();

		if (storeId != null) {
			Store store = findStoreOrThrow(storeId);
			verifyStoreOwner(store);
			if (normalizedCode != null) {
				verifyConnectedSource(storeId, normalizedCode);
			}
		}

		long totalCount = productRepository.count(
				MarketplaceProductSpecifications.marketplaceList(
						storeId,
						normalizedCode,
						null,
						null,
						null,
						null,
						accessibleStoreIds));
		long syncedCount = productRepository.count(
				MarketplaceProductSpecifications.marketplaceList(
						storeId,
						normalizedCode,
						null,
						null,
						null,
						"synced",
						accessibleStoreIds));
		long unmappedCount = productRepository.count(
				MarketplaceProductSpecifications.marketplaceList(
						storeId,
						normalizedCode,
						null,
						null,
						null,
						"unmapped",
						accessibleStoreIds));

		double mappingRatePercent = totalCount > 0
				? (syncedCount * 100.0) / totalCount
				: 0.0;

		return new MarketplaceProductStatsDto(
				totalCount,
				syncedCount,
				unmappedCount,
				mappingRatePercent);
	}

	private static PageRequest resolvePageRequest(
			int pageNumber,
			int pageSize,
			String sortBy,
			SortOrder sortOrder) {
		String field = StringUtils.hasText(sortBy) && ALLOWED_SORT_FIELDS.contains(sortBy.trim())
				? sortBy.trim()
				: "updatedAt";
		Sort.Direction direction = sortOrder == SortOrder.ASC ? Sort.Direction.ASC : Sort.Direction.DESC;
		return PageRequest.of(pageNumber - 1, pageSize, Sort.by(direction, field));
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public MarketplaceProductDetailDto getProductDetail(Long productId) {
		Product product = productRepository.findById(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found: id=" + productId));
		if (!StringUtils.hasText(product.getMarketplaceCode())) {
			throw new ResourceNotFoundException("Product is not a marketplace product: id=" + productId);
		}
		Store store = product.getStore();
		if (store == null) {
			throw new ResourceNotFoundException("Product store not found: id=" + productId);
		}
		verifyStoreOwner(store);

		String marketplaceCode = product.getMarketplaceCode().toUpperCase();
		String marketplaceName = resolveMarketplaceName(store.getId(), marketplaceCode);
		String price = product.getPrice() != null ? product.getPrice().toPlainString() : "0";

		return new MarketplaceProductDetailDto(
				product.getId(),
				store.getId(),
				store.getName(),
				marketplaceCode,
				marketplaceName,
				product.getExternalProductId(),
				product.getSku(),
				product.getName(),
				product.getDescription(),
				price,
				product.getCurrency(),
				product.getStatus(),
				MarketplaceProductJsonSupport.parseImages(product.getImagesJson()),
				MarketplaceProductJsonSupport.parseVariants(product.getVariantsJson()),
				MarketplaceProductErpSupport.fromProduct(product, mappingRepository));
	}

	private MarketplaceProductDto toListDto(
			Product product,
			Store store,
			String marketplaceCode,
			String marketplaceName) {
		String price = product.getPrice() != null ? product.getPrice().toPlainString() : "0";
		String erpStatus = MarketplaceProductErpSupport.erpStatusLabel(product, mappingRepository);
		return new MarketplaceProductDto(
				product.getId(),
				store != null ? store.getId() : null,
				store != null ? store.getName() : null,
				marketplaceCode,
				marketplaceName,
				product.getExternalProductId(),
				product.getSku(),
				product.getName(),
				price,
				product.getCurrency(),
				product.getStatus(),
				erpStatus);
	}

	private void verifyConnectedSource(Long storeId, String marketplaceCode) {
		connectionRepository
				.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
				.filter(item -> item.getStatus() == MarketplaceConnectionStatus.CONNECTED)
				.filter(item -> StringUtils.hasText(item.getAccessToken()))
				.orElseThrow(() -> new ResourceNotFoundException(
						"No connected marketplace found for storeId=" + storeId + " marketplace=" + marketplaceCode));
	}

	private String resolveMarketplaceName(Long storeId, String marketplaceCode) {
		return connectionRepository
				.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
				.map(StoreMarketplaceConnection::getMarketplace)
				.map(Marketplace::getName)
				.filter(StringUtils::hasText)
				.orElse(marketplaceCode);
	}

	private List<Store> resolveAccessibleStores() {
		if (authz.isAdmin()) {
			return storeRepository.findByActiveTrue();
		}
		Long userId = requireCurrentUserId();
		return storeRepository.findByOwner_Id(userId);
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

	private static String buildSourceLabel(
			String storeName,
			String marketplaceName,
			String displayName,
			String country) {
		StringBuilder label = new StringBuilder();
		label.append(storeName != null ? storeName.trim() : "Store");
		label.append(" — ").append(marketplaceName);
		if (StringUtils.hasText(displayName)) {
			label.append(" (").append(displayName).append(")");
		} else if (StringUtils.hasText(country)) {
			label.append(" (").append(country).append(")");
		}
		return label.toString();
	}

	public record MarketplaceProductPageResult(List<MarketplaceProductDto> items, PageMeta meta) {
	}
}
