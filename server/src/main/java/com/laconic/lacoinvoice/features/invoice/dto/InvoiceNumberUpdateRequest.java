package com.laconic.lacoinvoice.features.invoice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceInvoiceNumberUpdateRequest")
public class InvoiceNumberUpdateRequest {

	@NotBlank
	@Size(max = 100)
	private String invoiceNumber;
}
