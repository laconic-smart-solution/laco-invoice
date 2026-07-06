package com.laconic.lacoinvoice.features.erp.pageable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceErpItemFilter")
public class ErpItemFilter {

	private String erpCode;

	private String name;
}
