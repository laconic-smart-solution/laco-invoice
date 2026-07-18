package com.laconic.lacoinvoice.integration.marketplace.client;

import java.math.BigDecimal;
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
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayOrderLineItemData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayOrderListData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductDetailData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayProductListData;
import com.laconic.lacoinvoice.integration.marketplace.dto.GatewayStoreData;
import com.laconic.lacoinvoice.integration.marketplace.order.GatewayOrderData;
import com.laconic.lacoinvoice.integration.marketplace.order.GatewayOrderLineItem;

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
	private static final ParameterizedTypeReference<GatewayApiResponse<GatewayProductListData>> PRODUCTS_TYPE =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<GatewayApiResponse<GatewayProductDetailData>> PRODUCT_DETAIL_TYPE =
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
	public List<GatewayOrderData> listOrders(
			UUID tenantId,
			String accessToken,
			String sellerId,
			String updatedFrom,
			int page,
			int limit) {
		int safePage = page < 1 ? 1 : page;
		int safeLimit = limit < 1 ? 20 : Math.min(limit, 100);

		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(resolveApiUrl("/api/v1/orders"))
				.queryParam("access_token", accessToken)
				.queryParam("page", safePage)
				.queryParam("limit", safeLimit);
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

	@Override
	public GatewayProductListData listProducts(
			UUID tenantId,
			String accessToken,
			String sellerId,
			int page,
			int limit,
			String search) {
		int safePage = page < 1 ? 1 : page;
		int safeLimit = limit < 1 ? 20 : Math.min(limit, 100);

		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(resolveApiUrl("/api/v1/products"))
				.queryParam("access_token", accessToken)
				.queryParam("page", safePage)
				.queryParam("limit", safeLimit);
		if (sellerId != null && !sellerId.isBlank()) {
			builder.queryParam("seller_id", sellerId);
			builder.queryParam("shop_id", sellerId);
		}
		if (search != null && !search.isBlank()) {
			builder.queryParam("search", search);
		}
		GatewayProductListData data = exchange(
				restClient.get().uri(builder.build().toUriString()),
				tenantId,
				null,
				PRODUCTS_TYPE);
		if (data == null) {
			return new GatewayProductListData(List.of(), 0);
		}
		return data;
	}

	@Override
	public GatewayProductDetailData getProduct(
			UUID tenantId,
			String accessToken,
			String sellerId,
			String externalProductId,
			String sku) {
		if (externalProductId == null || externalProductId.isBlank()) {
			throw new BadGatewayException(serviceLabel + " requires external product id.");
		}

		UriComponentsBuilder builder = UriComponentsBuilder
				.fromUriString(resolveApiUrl("/api/v1/products/" + externalProductId.trim()))
				.queryParam("access_token", accessToken);
		if (sellerId != null && !sellerId.isBlank()) {
			builder.queryParam("seller_id", sellerId);
			builder.queryParam("shop_id", sellerId);
		}
		if (sku != null && !sku.isBlank()) {
			builder.queryParam("sku", sku);
		}
		return exchange(
				restClient.get().uri(builder.build().toUriString()),
				tenantId,
				null,
				PRODUCT_DETAIL_TYPE);
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
		List<GatewayOrderLineItem> lineItems = List.of();
		if (item.items() != null && !item.items().isEmpty()) {
			lineItems = item.items().stream().map(this::toOrderLineItem).toList();
		}
		return new GatewayOrderData(
				item.externalOrderId(),
				item.status(),
				item.totalAmount(),
				item.currency(),
				orderedAt,
				item.customerName(),
				item.customerEmail(),
				item.customerPhone(),
				item.customerAddress(),
				lineItems);
	}

	private GatewayOrderLineItem toOrderLineItem(GatewayOrderLineItemData item) {
		BigDecimal price = parseAmount(item.price());
		int quantity = item.quantity() != null && item.quantity() > 0 ? item.quantity() : 1;
		BigDecimal lineTotal = parseAmount(item.lineTotal());
		if (lineTotal.compareTo(BigDecimal.ZERO) == 0 && price.compareTo(BigDecimal.ZERO) > 0) {
			lineTotal = price.multiply(BigDecimal.valueOf(quantity));
		}
		return new GatewayOrderLineItem(
				item.sku(),
				item.productName(),
				price,
				quantity,
				lineTotal);
	}

	private static BigDecimal parseAmount(String raw) {
		if (raw == null || raw.isBlank()) {
			return BigDecimal.ZERO;
		}
		try {
			return new BigDecimal(raw.trim());
		} catch (NumberFormatException ex) {
			return BigDecimal.ZERO;
		}
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
			request = applyVendorHeaders(request);
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

	/**
	 * Marketplace-specific headers (e.g. Lazada app credentials). Default: no-op.
	 */
	protected RestClient.RequestHeadersSpec<?> applyVendorHeaders(RestClient.RequestHeadersSpec<?> request) {
		return request;
	}

	protected CommunicationProperties properties() {
		return properties;
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
