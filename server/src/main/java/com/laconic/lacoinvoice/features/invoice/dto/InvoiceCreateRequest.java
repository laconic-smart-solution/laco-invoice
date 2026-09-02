package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceInvoiceCreateRequest")
public class InvoiceCreateRequest {

	@Size(max = 100)
	private String invoiceNumber;

	@NotBlank
	@Size(max = 200)
	private String title;

	@NotNull
	private Long storeId;

	@NotBlank
	private String marketplaceCode;

	@NotNull
	private LocalDate startDate;

	@NotNull
	private LocalDate endDate;

	/** When set, only orders imported by this order data input set are billed. */
	private Long orderRunId;

	private BigDecimal vatRate;

	private String notes;

	private String buyerName;

	private String buyerTaxId;

	private String buyerAddress;
}
