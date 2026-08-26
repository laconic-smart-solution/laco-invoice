package com.laconic.lacoinvoice.common.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import com.laconic.lacoinvoice.features.order.import_.OrderSkuListExcelParser;
import com.laconic.lacoinvoice.features.order.import_.ParsedOrderSkuListWorkbook;

class ExcelXmlNormalizerTest {

	@Test
	void fixDuplicateRowTags_mergesSameRowElements() {
		String inputXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
				+ "<worksheet><sheetData>"
				+ "<row r=\"1\"><c r=\"A1\"><v>Order ID</v></c></row>"
				+ "<row r=\"1\"><c r=\"B1\"><v>Order Status</v></c></row>"
				+ "<row r=\"2\"><c r=\"A2\"><v>584100137511978099</v></c></row>"
				+ "<row r=\"2\"><c r=\"B2\"><v>Completed</v></c></row>"
				+ "</sheetData></worksheet>";

		String normalized = ExcelXmlNormalizer.fixDuplicateRowTags(inputXml);

		assertThat(normalized)
				.contains("<row r=\"1\"><c r=\"A1\"><v>Order ID</v></c><c r=\"B1\"><v>Order Status</v></c></row>")
				.contains("<row r=\"2\"><c r=\"A2\"><v>584100137511978099</v></c><c r=\"B2\"><v>Completed</v></c></row>");
	}

	@Test
	void parseTiktokExport_withDuplicateRowTags_succeeds() throws Exception {
		File file = new File("d:\\Laconic\\dev\\invoice\\5月份yoik店铺订单.xlsx");
		if (!file.exists()) {
			return;
		}

		OrderSkuListExcelParser parser = new OrderSkuListExcelParser();
		try (FileInputStream in = new FileInputStream(file)) {
			ParsedOrderSkuListWorkbook parsed = parser.parse(in);
			assertThat(parsed).isNotNull();
			assertThat(parsed.ordersByExternalId()).isNotEmpty();
			assertThat(parsed.ordersByExternalId()).containsKey("584100137511978099");
		}
	}
}
