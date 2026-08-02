package com.laconic.lacoinvoice.features.order;

import java.util.List;

import com.laconic.lacoinvoice.features.order.pageable.OrderFilter;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceOrderExportRequest")
public class OrderExportRequest {

	/** When non-empty, export / preview only these order IDs. */
	private List<Long> ids;

	/** When true (and ids empty), export all orders matching {@link #filter}. */
	private boolean exportAll;

	private OrderFilter filter;

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
