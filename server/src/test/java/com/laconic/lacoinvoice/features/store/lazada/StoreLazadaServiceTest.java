package com.laconic.lacoinvoice.features.store.lazada;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;
import com.laconic.lacoinvoice.features.store.StoreMarketplaceConnectionDto;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectRequest;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectionService;
import com.laconic.lacoinvoice.features.store.marketplace.StoreMarketplaceConnectionViewDto;

@ExtendWith(MockitoExtension.class)
class StoreLazadaServiceTest {

	@Mock
	private StoreMarketplaceConnectionService connectionService;

	@InjectMocks
	private StoreLazadaService service;

	@Test
	void connectDelegatesToConnectionService() {
		UUID externalId = UUID.randomUUID();
		StoreMarketplaceConnectionDto dto = new StoreMarketplaceConnectionDto(
				100L,
				5L,
				3L,
				"LAZADA",
				"Lazada",
				externalId,
				"seller-1",
				"TH",
				"My Lazada",
				Instant.parse("2026-12-31T00:00:00Z"),
				MarketplaceConnectionStatus.CONNECTED,
				Instant.parse("2026-01-01T00:00:00Z"),
				Instant.parse("2026-01-02T00:00:00Z"));

		StoreLazadaConnectRequest request = new StoreLazadaConnectRequest();
		request.setCode("oauth-code");
		request.setDisplayName("My Lazada");

		when(connectionService.connect(eq(5L), eq("LAZADA"), org.mockito.ArgumentMatchers.any()))
				.thenReturn(dto);

		StoreMarketplaceConnectionDto result = service.connect(5L, request);

		assertThat(result.externalConnectionId()).isEqualTo(externalId);
		verify(connectionService).connect(eq(5L), eq("LAZADA"), org.mockito.ArgumentMatchers.any(StoreMarketplaceConnectRequest.class));
	}

	@Test
	void revokeDelegatesToConnectionService() {
		UUID externalId = UUID.randomUUID();
		service.revokeConnection(5L, externalId);
		verify(connectionService).revokeConnection(5L, "LAZADA", externalId);
	}

	@Test
	void listMapsConnectionViews() {
		UUID externalId = UUID.randomUUID();
		when(connectionService.listConnections(5L, "LAZADA")).thenReturn(List.of(
				new StoreMarketplaceConnectionViewDto(
						"LAZADA",
						100L,
						externalId,
						5L,
						"seller-1",
						"My Lazada",
						"TH",
						"account",
						"short",
						Instant.parse("2026-12-31T00:00:00Z"),
						null,
						MarketplaceConnectionStatus.CONNECTED,
						Instant.parse("2026-01-01T00:00:00Z"))));

		List<StoreLazadaConnectionDto> result = service.listConnections(5L);

		assertThat(result).hasSize(1);
		assertThat(result.get(0).externalConnectionId()).isEqualTo(externalId);
	}
}
