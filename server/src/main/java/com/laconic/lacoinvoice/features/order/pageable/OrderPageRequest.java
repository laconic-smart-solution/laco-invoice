package com.laconic.lacoinvoice.features.order.pageable;

import com.laconic.lacoinvoice.common.pagination.PageAndFilterDTO;
import com.laconic.lacoinvoice.common.pagination.SortOrder;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceOrderPageRequest")
public class OrderPageRequest {

	@Min(1)
	private int pageNumber = 1;

	@Min(1)
	@Max(500)
	private int pageSize = 10;

	private String sortBy;

	private SortOrder sortOrder;

	private OrderFilter filter;

	public PageAndFilterDTO<OrderFilter> toPageAndFilter() {
		return PageAndFilterDTO.<OrderFilter>builder()
				.pageNumber(pageNumber)
				.pageSize(pageSize)
				.sortBy(sortBy)
				.sortOrder(sortOrder)
				.filter(filter)
				.build();
	}
}
