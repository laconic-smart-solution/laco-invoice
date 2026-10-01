package com.laconic.lacoinvoice.features.store.pageable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceStoreFilter")
public class StoreFilter {

	private String name;

	private Boolean active;

	private Long ownerId;
}
