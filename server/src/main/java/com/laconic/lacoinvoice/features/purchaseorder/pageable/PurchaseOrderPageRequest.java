package com.laconic.lacoinvoice.features.purchaseorder.pageable;

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
@Schema(name = "LacoinvoicePurchaseOrderPageRequest")
public class PurchaseOrderPageRequest {

	@Min(1)
	private int pageNumber = 1;

	@Min(1)
	@Max(500)
	private int pageSize = 10;

	private String sortBy;

	private SortOrder sortOrder;

	private PurchaseOrderFilter filter;

	public PageAndFilterDTO<PurchaseOrderFilter> toPageAndFilter() {
		return PageAndFilterDTO.<PurchaseOrderFilter>builder()
				.pageNumber(pageNumber)
				.pageSize(pageSize)
				.sortBy(sortBy)
				.sortOrder(sortOrder)
				.filter(filter)
				.build();
	}
}
