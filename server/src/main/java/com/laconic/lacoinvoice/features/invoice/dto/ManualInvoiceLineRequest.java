package com.laconic.lacoinvoice.features.invoice.dto;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceManualInvoiceLineRequest")
public class ManualInvoiceLineRequest {

	@NotBlank
	@Size(max = 255)
	private String productName;

	@Size(max = 400)
	private String description;

	@Size(max = 100)
	private String sku;

	@NotNull
	@Min(1)
	private Integer quantity;

	@NotNull
	@DecimalMin("0.00")
	private BigDecimal unitPrice;

	@DecimalMin("0.00")
	private BigDecimal discount = BigDecimal.ZERO;
}
