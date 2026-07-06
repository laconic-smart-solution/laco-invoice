package com.laconic.lacoinvoice.features.store.lazada;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(name = "LacoinvoiceStoreLazadaConnectRequest")
public class StoreLazadaConnectRequest {

	@NotBlank
	private String code;

	private String displayName;
}
