package com.laconic.lacoinvoice.features.purchaseorder;

import java.math.BigDecimal;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.PurchaseOrderStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

public final class PurchaseOrderCommands {

	private PurchaseOrderCommands() {
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoicePurchaseOrderItemRequest")
	public static class ItemRequest {

		@NotNull
		private Long erpItemId;

		@NotNull
		private Integer quantity;

		@NotNull
		private BigDecimal unitPrice;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoicePurchaseOrderCreateRequest")
	public static class CreateRequest {

		@NotBlank
		private String poNumber;

		private PurchaseOrderStatus status;

		@NotEmpty
		@Valid
		private List<ItemRequest> items;
	}

	@Getter
	@Setter
	@Schema(name = "LacoinvoicePurchaseOrderUpdateRequest")
	public static class UpdateRequest {

		@NotBlank
		private String poNumber;

		private PurchaseOrderStatus status;

		@NotEmpty
		@Valid
		private List<ItemRequest> items;
	}
}
