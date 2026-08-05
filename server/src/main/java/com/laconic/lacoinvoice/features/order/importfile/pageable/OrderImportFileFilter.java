package com.laconic.lacoinvoice.features.order.importfile.pageable;

import com.laconic.lacoinvoice.domain.models.OrderImportStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceOrderImportFileFilter")
public class OrderImportFileFilter {

	private Long storeId;

	private Long marketplaceId;

	private String marketplaceCode;

	private OrderImportStatus status;

	private String originalFilename;
}
