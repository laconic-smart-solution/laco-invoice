package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.util.Collections;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductDetail;

final class MarketplaceProductJsonSupport {

	private static final ObjectMapper MAPPER = new ObjectMapper();
	private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
	};
	private static final TypeReference<List<MarketplaceProductVariantDto>> VARIANT_LIST = new TypeReference<>() {
	};

	private MarketplaceProductJsonSupport() {
	}

	static String toImagesJson(List<String> images) {
		if (images == null || images.isEmpty()) {
			return null;
		}
		try {
			return MAPPER.writeValueAsString(images);
		} catch (Exception ex) {
			return null;
		}
	}

	static List<String> parseImages(String imagesJson) {
		if (imagesJson == null || imagesJson.isBlank()) {
			return List.of();
		}
		try {
			return MAPPER.readValue(imagesJson, STRING_LIST);
		} catch (Exception ex) {
			return List.of();
		}
	}

	static String toVariantsJson(List<GatewayProductDetail.GatewayProductVariant> variants) {
		if (variants == null || variants.isEmpty()) {
			return null;
		}
		try {
			List<MarketplaceProductVariantDto> mapped = variants.stream()
					.map(variant -> new MarketplaceProductVariantDto(
							variant.sku(),
							variant.price(),
							variant.currency(),
							variant.status(),
							variant.quantity()))
					.toList();
			return MAPPER.writeValueAsString(mapped);
		} catch (Exception ex) {
			return null;
		}
	}

	static String toVariantsJsonFromDto(List<MarketplaceProductVariantDto> variants) {
		if (variants == null || variants.isEmpty()) {
			return null;
		}
		try {
			return MAPPER.writeValueAsString(variants);
		} catch (Exception ex) {
			return null;
		}
	}

	static List<MarketplaceProductVariantDto> parseVariants(String variantsJson) {
		if (variantsJson == null || variantsJson.isBlank()) {
			return Collections.emptyList();
		}
		try {
			return MAPPER.readValue(variantsJson, VARIANT_LIST);
		} catch (Exception ex) {
			return Collections.emptyList();
		}
	}
}
