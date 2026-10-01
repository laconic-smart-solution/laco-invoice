package com.laconic.lacoinvoice.features.purchaseorder.pageable;

import com.laconic.lacoinvoice.domain.models.PurchaseOrderStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoicePurchaseOrderFilter")
public class PurchaseOrderFilter {

	private String poNumber;

	private PurchaseOrderStatus status;
}
