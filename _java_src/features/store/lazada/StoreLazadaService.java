package com.laconic.lacoinvoice.features.store.lazada;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.features.store.StoreMarketplaceConnectionDto;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceAuthorizeUrlDto;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectRequest;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectionService;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectionViewDto;

@Service
public class StoreLazadaService {

	private static final String MARKETPLACE_CODE = "LAZADA";

	private final StoreMarketplaceConnectionService connectionService;

	public StoreLazadaService(StoreMarketplaceConnectionService connectionService) {
		this.connectionService = connectionService;
	}

	@Transactional(readOnly = true)
	public StoreLazadaAuthorizeUrlDto getAuthorizeUrl(Long storeId) {
		StoreMarketplaceAuthorizeUrlDto result = connectionService.getAuthorizeUrl(storeId, MARKETPLACE_CODE);
		return new StoreLazadaAuthorizeUrlDto(result.url(), result.state());
	}

	@Transactional
	public StoreMarketplaceConnectionDto connect(Long storeId, StoreLazadaConnectRequest request) {
		StoreMarketplaceConnectRequest payload = new StoreMarketplaceConnectRequest();
		payload.setCode(request.getCode());
		payload.setDisplayName(request.getDisplayName());
		return connectionService.connect(storeId, MARKETPLACE_CODE, payload);
	}

	@Transactional(readOnly = true)
	public List<StoreLazadaConnectionDto> listConnections(Long storeId) {
		return connectionService.listConnections(storeId, MARKETPLACE_CODE).stream()
				.map(this::toLazadaDto)
				.toList();
	}

	@Transactional
	public StoreMarketplaceConnectionDto refreshConnection(Long storeId, UUID externalConnectionId) {
		return connectionService.refreshConnection(storeId, MARKETPLACE_CODE, externalConnectionId);
	}

	@Transactional
	public void revokeConnection(Long storeId, UUID externalConnectionId) {
		connectionService.revokeConnection(storeId, MARKETPLACE_CODE, externalConnectionId);
	}

	private StoreLazadaConnectionDto toLazadaDto(StoreMarketplaceConnectionViewDto view) {
		return new StoreLazadaConnectionDto(
				view.localConnectionId(),
				view.externalConnectionId(),
				view.storeId(),
				view.sellerId(),
				view.displayName(),
				view.country(),
				view.account(),
				view.shortCode(),
				view.tokenExpiresAt(),
				view.refreshExpiresAt(),
				view.status(),
				view.createdAt());
	}
}
