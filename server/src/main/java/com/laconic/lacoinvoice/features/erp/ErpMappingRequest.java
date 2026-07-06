package com.laconic.lacoinvoice.features.erp;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(name = "LacoinvoiceErpMappingRequest")
public class ErpMappingRequest {

	@NotNull
	private Long erpItemId;
}
