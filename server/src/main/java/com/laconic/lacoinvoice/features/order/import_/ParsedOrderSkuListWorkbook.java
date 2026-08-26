package com.laconic.lacoinvoice.features.order.import_;

import java.util.Map;

public record ParsedOrderSkuListWorkbook(
		String sheetName,
		int rowCount,
		Map<String, OrderSkuListExcelRow> ordersByExternalId) {
}
