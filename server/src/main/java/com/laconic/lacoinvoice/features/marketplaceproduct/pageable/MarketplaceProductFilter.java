package com.laconic.lacoinvoice.features.marketplaceproduct.pageable;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceMarketplaceProductFilter")
public class MarketplaceProductFilter {

	private Long storeId;

	private String marketplaceCode;

	private String search;

	private BigDecimal priceMin;

	private BigDecimal priceMax;

	private String erpStatus;
}
