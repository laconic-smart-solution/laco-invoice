package com.laconic.lacoinvoice.features.store;

import java.time.Instant;

import com.laconic.lacoinvoice.domain.models.MarketplaceConnectionStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

public final class StoreCommands {

	private StoreCommands() {
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceStoreCreateRequest")
	public static class CreateRequest {

		@NotBlank
		private String name;

		private String logoUrl;

		private Boolean active;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceStoreUpdateRequest")
	public static class UpdateRequest {

		@NotBlank
		private String name;

		private String logoUrl;

		private Boolean active;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoiceStoreMarketplaceConnectionCreateRequest")
	public static class MarketplaceConnectionCreateRequest {

		@NotNull
		private Long marketplaceId;

		private String accessToken;

		private String refreshToken;

		private Instant tokenExpiry;

		private MarketplaceConnectionStatus status;
	}
}
