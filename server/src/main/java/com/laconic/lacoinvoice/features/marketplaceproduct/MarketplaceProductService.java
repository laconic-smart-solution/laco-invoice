package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.config.AuthorizationService;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductDetail;
import com.laconic.lacoinvoice.integration.marketplace.product.MarketplaceProductAdapterRegistry;
import com.laconic.lacoinvoice.integration.marketplace.product.MarketplaceProductPage;

@Service
public class MarketplaceProductService {

	private final StoreRepository storeRepository;
	private final StoreMarketplaceConnectionRepository connectionRepository;
	private final MarketplaceProductAdapterRegistry adapterRegistry;
	private final AuthorizationService authz;

	public MarketplaceProductService(
			StoreRepository storeRepository,
			StoreMarketplaceConnectionRepository connectionRepository,
			MarketplaceProductAdapterRegistry adapterRegistry,
			AuthorizationService authz) {
		this.storeRepository = storeRepository;
		this.connectionRepository = connectionRepository;
		this.adapterRegistry = adapterRegistry;
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
				sources.add(new MarketplaceProductSourceDto(
						store.getId(),
						store.getName(),
						marketplaceCode,
						marketplaceName,
						connection.getExternalConnectionId(),
						label,
						country));
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
			BigDecimal priceMax) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		StoreMarketplaceConnection connection = connectionRepository
				.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
				.filter(item -> item.getStatus() == MarketplaceConnectionStatus.CONNECTED)
				.orElseThrow(() -> new ResourceNotFoundException(
						"No connected marketplace found for storeId=" + storeId + " marketplace=" + marketplaceCode));

		Marketplace marketplace = connection.getMarketplace();
		String normalizedCode = marketplace != null ? marketplace.getCode().toUpperCase() : marketplaceCode.toUpperCase();
		String marketplaceName = marketplace != null && marketplace.getName() != null
				? marketplace.getName()
				: normalizedCode;

		MarketplaceProductPage productPage = adapterRegistry.resolve(normalizedCode)
				.fetchProductPage(connection, page, limit, search);

		List<MarketplaceProductDto> items = productPage.items().stream()
				.filter(item -> matchesPriceRange(item.price(), priceMin, priceMax))
				.map(item -> new MarketplaceProductDto(
						store.getId(),
						store.getName(),
						normalizedCode,
						marketplaceName,
						item.externalProductId(),
						item.sku(),
						item.name(),
						item.price(),
						item.currency(),
						item.status()))
				.toList();

		int safePage = page < 1 ? 1 : page;
		int safeLimit = limit < 1 ? 20 : Math.min(limit, 100);
		long total = productPage.total();
		int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeLimit);
		PageMeta meta = new PageMeta(safePage - 1, safeLimit, total, totalPages);
		return new MarketplaceProductPageResult(items, meta);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public MarketplaceProductDetailDto getProductDetail(
			Long storeId,
			String marketplaceCode,
			String externalProductId,
			String sku) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		StoreMarketplaceConnection connection = connectionRepository
				.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
				.filter(item -> item.getStatus() == MarketplaceConnectionStatus.CONNECTED)
				.orElseThrow(() -> new ResourceNotFoundException(
						"No connected marketplace found for storeId=" + storeId + " marketplace=" + marketplaceCode));

		Marketplace marketplace = connection.getMarketplace();
		String normalizedCode = marketplace != null ? marketplace.getCode().toUpperCase() : marketplaceCode.toUpperCase();
		String marketplaceName = marketplace != null && marketplace.getName() != null
				? marketplace.getName()
				: normalizedCode;

		GatewayProductDetail detail = adapterRegistry.resolve(normalizedCode)
				.fetchProductDetail(connection, externalProductId, sku);

		String resolvedSku = detail.sku() != null ? detail.sku() : sku;
		List<MarketplaceProductVariantDto> variants = detail.variants() == null
				? List.of()
				: detail.variants().stream()
						.map(variant -> new MarketplaceProductVariantDto(
								variant.sku(),
								variant.price(),
								variant.currency(),
								variant.status(),
								variant.quantity()))
						.toList();

		return new MarketplaceProductDetailDto(
				store.getId(),
				store.getName(),
				normalizedCode,
				marketplaceName,
				detail.externalProductId(),
				resolvedSku,
				detail.name(),
				detail.description(),
				detail.price(),
				detail.currency(),
				detail.status(),
				detail.images() != null ? detail.images() : List.of(),
				variants,
				MarketplaceProductErpSupport.derivePlaceholderErp(detail.externalProductId(), resolvedSku));
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

	private static boolean matchesPriceRange(String rawPrice, BigDecimal min, BigDecimal max) {
		if (min == null && max == null) {
			return true;
		}
		if (!StringUtils.hasText(rawPrice)) {
			return false;
		}
		try {
			BigDecimal price = new BigDecimal(rawPrice.trim());
			if (min != null && price.compareTo(min) < 0) {
				return false;
			}
			if (max != null && price.compareTo(max) > 0) {
				return false;
			}
			return true;
		} catch (NumberFormatException ex) {
			return false;
		}
	}

	public record MarketplaceProductPageResult(List<MarketplaceProductDto> items, PageMeta meta) {
	}
}
