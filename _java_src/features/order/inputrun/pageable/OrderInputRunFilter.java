package com.laconic.lacoinvoice.features.order.inputrun.pageable;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class OrderInputRunFilter {

	private Long storeId;
	private Long marketplaceId;
	private String marketplaceCode;
	private String title;
	private String status;
	private String inputFileType;
}
