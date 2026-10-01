package com.laconic.lacoinvoice.features.store.marketplace;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "StoreMarketplaceAuthorizeUrlDto")
public record StoreMarketplaceAuthorizeUrlDto(String url, String state) {
}
