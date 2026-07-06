package com.laconic.lacoinvoice.features.product.pageable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceProductFilter")
public class ProductFilter {

	private String sku;

	private String name;
}
