package com.laconic.lacoinvoice.features.tiktokscrape;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceTikTokSellerSessionDto")
public record TikTokSellerSessionDto(
		Long id,
		String sellerId,
		String displayName,
		String storageStateJson,
		Instant updatedAt) {
}
