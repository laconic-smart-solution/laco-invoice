package com.laconic.lacoinvoice.integration.lazada.dto;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LazadaStoreData(
		UUID id,
		@JsonProperty("tenant_id") UUID tenantId,
		@JsonProperty("seller_id") String sellerId,
		@JsonProperty("display_name") String displayName,
		String country,
		String account,
		@JsonProperty("short_code") String shortCode,
		@JsonProperty("token_expires_at") Instant tokenExpiresAt,
		@JsonProperty("refresh_expires_at") Instant refreshExpiresAt,
		@JsonProperty("created_at") Instant createdAt) {
}
