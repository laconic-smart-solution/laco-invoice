package com.laconic.lacoinvoice.integration.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.config.CommunicationProperties;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayApiResponse;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayAuthorizeUrlData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayOrderItemData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayOrderListData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;

public abstract class AbstractMarketplaceGatewayClient implements MarketplaceGatewayClient {

	private static final ParameterizedTypeReference<GatewayApiResponse<GatewayAuthorizeUrlData>> AUTHORIZE_TYPE =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<GatewayApiResponse<GatewayStoreData>> STORE_TYPE =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<GatewayApiResponse<GatewayOrderListData>> ORDERS_TYPE =
			new ParameterizedTypeReference<>() {
			};

	private final RestClient restClient;
	private final CommunicationProperties properties;
	private final String serviceLabel;
	private final String basePathProperty;

	protected AbstractMarketplaceGatewayClient(
			RestClient restClient,
			CommunicationProperties properties,
			String serviceLabel,
			String basePathProperty) {
		this.restClient = restClient;
		this.properties = properties;
		this.serviceLabel = serviceLabel;
		this.basePathProperty = basePathProperty;
	}

	@Override
	public String getAuthorizeUrl(UUID tenantId, UUID actorId, String state) {
		String uri = UriComponentsBuilder.fromUriString(resolveApiUrl("/api/v1/stores/authorize-url"))
				.queryParam("state", state)
				.build()
				.toUriString();
		GatewayAuthorizeUrlData data = exchange(
				restClient.get().uri(uri),
				tenantId,
				actorId,
				AUTHORIZE_TYPE);
		if (data == null || data.url() == null || data.url().isBlank()) {
			throw new BadGatewayException(serviceLabel + " returned an empty authorize URL.");
		}
		return data.url();
	}

	@Override
	public GatewayStoreData connect(UUID tenantId, UUID actorId, String code, String displayName, String shopId) {
		ConnectPayload payload = new ConnectPayload(code, displayName, shopId);
		return exchange(
				restClient.post()
						.uri(resolveApiUrl("/api/v1/stores/connect"))
						.contentType(MediaType.APPLICATION_JSON)
						.body(payload),
				tenantId,
				actorId,
				STORE_TYPE);
	}

	@Override
	public GatewayStoreData refresh(UUID tenantId, UUID actorId, String refreshToken, String shopId) {
		RefreshPayload payload = new RefreshPayload(refreshToken, shopId);
		return exchange(
				restClient.post()
						.uri(resolveApiUrl("/api/v1/stores/refresh"))
						.contentType(MediaType.APPLICATION_JSON)
						.body(payload),
				tenantId,
				actorId,
				STORE_TYPE);
	}

	@Override
	public List<GatewayOrderData> listOrders(UUID tenantId, String accessToken, String sellerId, String updatedFrom) {
		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(resolveApiUrl("/api/v1/orders"))
				.queryParam("access_token", accessToken);
		if (sellerId != null && !sellerId.isBlank()) {
			builder.queryParam("seller_id", sellerId);
		}
		if (updatedFrom != null && !updatedFrom.isBlank()) {
			builder.queryParam("updated_from", updatedFrom);
		}
		GatewayOrderListData data = exchange(
				restClient.get().uri(builder.build().toUriString()),
				tenantId,
				null,
				ORDERS_TYPE);
		if (data == null || data.items() == null) {
			return List.of();
		}
		return data.items().stream().map(this::toOrderData).toList();
	}

	private GatewayOrderData toOrderData(GatewayOrderItemData item) {
		java.time.Instant orderedAt = null;
		if (item.orderedAt() != null && !item.orderedAt().isBlank()) {
			try {
				orderedAt = java.time.Instant.parse(item.orderedAt());
			} catch (Exception ignored) {
				orderedAt = null;
			}
		}
		return new GatewayOrderData(
				item.externalOrderId(),
				item.status(),
				item.totalAmount(),
				item.currency(),
				orderedAt);
	}

	protected <T> T exchange(
			RestClient.RequestHeadersSpec<?> spec,
			UUID tenantId,
			UUID actorId,
			ParameterizedTypeReference<GatewayApiResponse<T>> type) {
		try {
			RestClient.RequestHeadersSpec<?> request = spec.header("X-Gateway-Secret", properties.getGatewaySecret());
			if (tenantId != null) {
				request = request.header("X-Tenant-ID", tenantId.toString());
			}
			if (actorId != null) {
				request = request.header("X-Actor-ID", actorId.toString());
			}
			GatewayApiResponse<T> envelope = request.retrieve().body(type);
			if (envelope == null) {
				throw new BadGatewayException(serviceLabel + " returned an empty response.");
			}
			if (!envelope.success()) {
				String message = envelope.error() != null && !envelope.error().isBlank()
						? envelope.error()
						: serviceLabel + " request failed.";
				throw new BadGatewayException(message);
			}
			return envelope.data();
		} catch (RestClientResponseException e) {
			throw new BadGatewayException(serviceLabel + " HTTP error: " + e.getStatusCode().value(), e);
		} catch (BadGatewayException e) {
			throw e;
		} catch (Exception e) {
			throw new BadGatewayException(serviceLabel + " request failed: " + e.getMessage(), e);
		}
	}

	String resolveApiUrl(String path) {
		String base = properties.getGatewayUrl().replaceAll("/$", "");
		String prefix = basePathProperty;
		if (prefix != null && !prefix.isBlank()) {
			String normalized = prefix.startsWith("/") ? prefix : "/" + prefix;
			base += normalized.replaceAll("/$", "");
		}
		if (!path.startsWith("/")) {
			return base + "/" + path;
		}
		return base + path;
	}

	private record ConnectPayload(
			String code,
			@JsonProperty("display_name") String displayName,
			@JsonProperty("shop_id") String shopId) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	private record RefreshPayload(
			@JsonProperty("refresh_token") String refreshToken,
			@JsonProperty("shop_id") String shopId) {
	}
}
