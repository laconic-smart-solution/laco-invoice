package com.laconic.lacoinvoice.integration.marketplace;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public final class MarketplaceScopeSupport {

	private static final String TENANT_PREFIX = "laco-invoice:store:";
	private static final String ACTOR_PREFIX = "laco-invoice:user:";
	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	private MarketplaceScopeSupport() {
	}

	public static UUID toTenantUuid(Long storeId) {
		return UUID.nameUUIDFromBytes((TENANT_PREFIX + storeId).getBytes(StandardCharsets.UTF_8));
	}

	public static UUID toActorUuid(Long userId) {
		return UUID.nameUUIDFromBytes((ACTOR_PREFIX + userId).getBytes(StandardCharsets.UTF_8));
	}

	public static String buildOAuthState(Long storeId, String marketplaceCode) {
		try {
			String json = OBJECT_MAPPER.writeValueAsString(
					new OAuthState(storeId, marketplaceCode != null ? marketplaceCode.toUpperCase() : null));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
		} catch (JsonProcessingException e) {
			throw new IllegalStateException("Failed to encode OAuth state", e);
		}
	}

	public static OAuthStatePayload parseOAuthState(String state) {
		if (state == null || state.isBlank()) {
			throw new IllegalArgumentException("OAuth state is required.");
		}
		try {
			byte[] decoded = Base64.getUrlDecoder().decode(state.trim());
			JsonNode node = OBJECT_MAPPER.readTree(decoded);
			if (!node.hasNonNull("storeId")) {
				throw new IllegalArgumentException("OAuth state is missing storeId.");
			}
			Long storeId = node.get("storeId").asLong();
			String marketplace = node.hasNonNull("marketplace") ? node.get("marketplace").asText() : null;
			return new OAuthStatePayload(storeId, marketplace);
		} catch (IllegalArgumentException e) {
			throw e;
		} catch (Exception e) {
			throw new IllegalArgumentException("Invalid OAuth state.", e);
		}
	}

	public static Long parseStoreIdFromState(String state) {
		return parseOAuthState(state).storeId();
	}

	public record OAuthStatePayload(Long storeId, String marketplace) {
	}

	private record OAuthState(Long storeId, String marketplace) {
	}
}
