package com.laconic.lacoinvoice.features.customer;

import java.util.List;

import com.laconic.lacoinvoice.features.customer.pageable.CustomerFilter;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceCustomerExportRequest")
public class CustomerExportRequest {

	/** When non-empty, export / preview only these customer IDs. */
	private List<Long> ids;

	/** When true (and ids empty), export all customers matching {@link #filter}. */
	private boolean exportAll;

	private CustomerFilter filter;

	/**
	 * Optional Excel column keys in display order.
	 * When empty, all columns are exported.
	 */
	private List<String> columns;

	/** Preview page (1-based). Used by export preview only. */
	@Min(1)
	private Integer pageNumber = 1;

	/** Preview page size. Used by export preview only. */
	@Min(1)
	@Max(50)
	private Integer pageSize = 10;
}
