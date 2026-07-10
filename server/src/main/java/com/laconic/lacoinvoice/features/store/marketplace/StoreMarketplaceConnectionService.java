package com.laconic.lacoinvoice.features.store.marketplace;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.config.AuthorizationService;
import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreMarketplaceConnectionRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.store.StoreMapper;
import com.laconic.lacoinvoice.features.store.StoreMarketplaceConnectionDto;
import com.laconic.lacoinvoice.integration.marketplace.client.MarketplaceGatewayClient;
import com.laconic.lacoinvoice.integration.marketplace.MarketplaceScopeSupport;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;

@Service
public class StoreMarketplaceConnectionService {

	private final StoreRepository storeRepository;
	private final StoreMarketplaceConnectionRepository connectionRepository;
	private final MarketplaceRepository marketplaceRepository;
	private final Map<String, MarketplaceGatewayClient> clientsByCode;
	private final StoreMapper mapper;
	private final AuthorizationService authz;

	public StoreMarketplaceConnectionService(
			StoreRepository storeRepository,
			StoreMarketplaceConnectionRepository connectionRepository,
			MarketplaceRepository marketplaceRepository,
			List<MarketplaceGatewayClient> clients,
			StoreMapper mapper,
			AuthorizationService authz) {
		this.storeRepository = storeRepository;
		this.connectionRepository = connectionRepository;
		this.marketplaceRepository = marketplaceRepository;
		this.clientsByCode = clients.stream()
				.collect(Collectors.toMap(
						client -> client.marketplaceCode().toUpperCase(),
						Function.identity(),
						(existing, duplicate) -> existing));
		this.mapper = mapper;
		this.authz = authz;
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public StoreMarketplaceAuthorizeUrlDto getAuthorizeUrl(Long storeId, String marketplaceCode) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		MarketplaceGatewayClient client = resolveClient(marketplaceCode);
		UUID tenantId = MarketplaceScopeSupport.toTenantUuid(storeId);
		UUID actorId = MarketplaceScopeSupport.toActorUuid(requireCurrentUserId());
		String state = MarketplaceScopeSupport.buildOAuthState(storeId, marketplaceCode);
		String url = client.getAuthorizeUrl(tenantId, actorId, state);
		return new StoreMarketplaceAuthorizeUrlDto(url, state);
	}

	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public StoreMarketplaceConnectionDto connect(
			Long storeId,
			String marketplaceCode,
			StoreMarketplaceConnectRequest request) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		MarketplaceGatewayClient client = resolveClient(marketplaceCode);
		UUID tenantId = MarketplaceScopeSupport.toTenantUuid(storeId);
		UUID actorId = MarketplaceScopeSupport.toActorUuid(requireCurrentUserId());
		GatewayStoreData gatewayStore = client.connect(
				tenantId,
				actorId,
				request.getCode().trim(),
				request.getDisplayName(),
				request.getShopId());

		StoreMarketplaceConnection connection = MarketplaceConnectionSupport.upsertConnection(
				connectionRepository,
				marketplaceRepository,
				store,
				marketplaceCode,
				gatewayStore,
				request.getDisplayName());

		return mapper.toConnectionDto(connection);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<StoreMarketplaceConnectionViewDto> listConnections(Long storeId, String marketplaceCode) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		String normalizedCode = marketplaceCode.toUpperCase();
		return connectionRepository.findByStore_IdAndMarketplace_CodeIgnoreCase(storeId, marketplaceCode)
				.stream()
				.map(connection -> StoreMarketplaceConnectionViewDto.fromEntity(normalizedCode, connection))
				.toList();
	}

	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public StoreMarketplaceConnectionDto refreshConnection(
			Long storeId,
			String marketplaceCode,
			UUID externalConnectionId) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		StoreMarketplaceConnection connection = connectionRepository
				.findByStore_IdAndExternalConnectionId(storeId, externalConnectionId)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Marketplace connection not found: externalConnectionId=" + externalConnectionId));

		if (connection.getRefreshToken() == null || connection.getRefreshToken().isBlank()) {
			throw new ResourceNotFoundException("Connection has no refresh token; reconnect the marketplace.");
		}

		MarketplaceGatewayClient client = resolveClient(marketplaceCode);
		UUID tenantId = MarketplaceScopeSupport.toTenantUuid(storeId);
		UUID actorId = MarketplaceScopeSupport.toActorUuid(requireCurrentUserId());
		GatewayStoreData gatewayStore = client.refresh(
				tenantId,
				actorId,
				connection.getRefreshToken(),
				connection.getExternalSellerId());

		MarketplaceConnectionSupport.applyGatewayMetadata(connection, gatewayStore, connection.getDisplayName());
		connection.setStatus(MarketplaceConnectionStatus.CONNECTED);

		return mapper.toConnectionDto(connectionRepository.save(connection));
	}

	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void revokeConnection(Long storeId, String marketplaceCode, UUID externalConnectionId) {
		Store store = findStoreOrThrow(storeId);
		verifyStoreOwner(store);

		connectionRepository.findByStore_IdAndExternalConnectionId(storeId, externalConnectionId)
				.ifPresent(connection -> {
					connection.setStatus(MarketplaceConnectionStatus.DISCONNECTED);
					connection.setAccessToken(null);
					connection.setRefreshToken(null);
					connectionRepository.save(connection);
				});
	}

	private MarketplaceGatewayClient resolveClient(String marketplaceCode) {
		MarketplaceGatewayClient client = clientsByCode.get(marketplaceCode.toUpperCase());
		if (client == null) {
			throw new ResourceNotFoundException("Marketplace client not configured: code=" + marketplaceCode);
		}
		return client;
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
