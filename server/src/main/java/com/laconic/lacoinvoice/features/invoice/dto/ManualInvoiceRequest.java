package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceManualInvoiceRequest")
public class ManualInvoiceRequest {

	@Size(max = 100)
	private String invoiceNumber;

	@NotBlank
	@Size(max = 200)
	private String title;

	@NotNull
	private Long storeId;

	@NotBlank
	@Size(max = 50)
	private String marketplaceCode;

	@NotNull
	private LocalDate startDate;

	@NotNull
	private LocalDate endDate;

	@NotNull
	@DecimalMin("0.0000")
	@DecimalMax("1.0000")
	private BigDecimal vatRate;

	@NotBlank
	@Size(min = 3, max = 3)
	private String currency;

	@Size(max = 255)
	private String buyerName;

	@Size(max = 100)
	private String buyerTaxId;

	private String buyerAddress;

	private String notes;

	@Valid
	@NotEmpty
	private List<ManualInvoiceLineRequest> lines = new ArrayList<>();
}
