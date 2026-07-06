package com.laconic.lacoinvoice.features.store.lazada;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceStoreLazadaAuthorizeUrlDto")
public record StoreLazadaAuthorizeUrlDto(String url, String state) {
}
