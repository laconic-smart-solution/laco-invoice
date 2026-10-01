package com.laconic.lacoinvoice.features.invoice.dto;

import com.laconic.lacoinvoice.domain.models.InvoiceStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceInvoiceStatusUpdateRequest")
public class InvoiceStatusUpdateRequest {

	@NotNull
	private InvoiceStatus status;
}
