package com.laconic.lacoinvoice.features.invoice.pageable;

import com.laconic.lacoinvoice.domain.models.InvoiceStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceInvoiceFilter")
public class InvoiceFilter {

	private InvoiceStatus status;

	private String invoiceNo;

	private Long orderId;

	private Long storeId;
}
