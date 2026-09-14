package com.laconic.lacoinvoice.common.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import com.laconic.lacoinvoice.common.export.ExcelExportWriter.SheetData;

class ExportWriterTest {

	@Test
	void csvExportWriter_formatsRowsCorrectlyWithBom() {
		List<String> headers = List.of("Voucher No.", "Category", "Amount", "Description");
		List<List<Object>> rows = List.of(
				List.of("APV-202609-001", "APV", 1500.50, "Standard item"),
				List.of("APV-202609-002", "APV", 200.00, "Item with, comma and \"quotes\""),
				List.of("APV-202609-003", "APV", 0.00, LocalDate.of(2026, 9, 10))
		);

		byte[] csvBytes = CsvExportWriter.write(headers, rows, true);
		assertThat(csvBytes).isNotNull().isNotEmpty();

		// Check BOM
		assertThat(csvBytes[0]).isEqualTo((byte) 0xEF);
		assertThat(csvBytes[1]).isEqualTo((byte) 0xBB);
		assertThat(csvBytes[2]).isEqualTo((byte) 0xBF);

		String content = new String(csvBytes, StandardCharsets.UTF_8);
		assertThat(content).contains("Voucher No.,Category,Amount,Description");
		assertThat(content).contains("APV-202609-001,APV,1500.5,Standard item");
		assertThat(content).contains("\"Item with, comma and \"\"quotes\"\"\"");
		assertThat(content).contains("2026-09-10");
	}

	@Test
	void excelExportWriter_createsMultiSheetWorkbook() throws Exception {
		List<SheetData> sheets = List.of(
				new SheetData(
						"Vouchers",
						List.of("Voucher No.", "Date", "Status"),
						List.of(
								List.of("APV-202609-001", LocalDate.of(2026, 9, 10), "GENERATED"),
								List.of("APV-202609-002", LocalDate.of(2026, 9, 10), "POSTED")
						)
				),
				new SheetData(
						"Voucher_Lines",
						List.of("Local Voucher No.", "Line No.", "Debit", "Credit"),
						List.of(
								List.of("APV-202609-001", 1, 1000.0, 0.0),
								List.of("APV-202609-001", 2, 0.0, 1000.0)
						)
				)
		);

		byte[] xlsxBytes = ExcelExportWriter.writeSheets(sheets);
		assertThat(xlsxBytes).isNotNull().isNotEmpty();

		try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(xlsxBytes))) {
			assertThat(workbook.getNumberOfSheets()).isEqualTo(2);
			assertThat(workbook.getSheetName(0)).isEqualTo("Vouchers");
			assertThat(workbook.getSheetName(1)).isEqualTo("Voucher_Lines");

			// Sheet 1 checks
			var sheet0 = workbook.getSheetAt(0);
			assertThat(sheet0.getRow(0).getCell(0).getStringCellValue()).isEqualTo("Voucher No.");
			assertThat(sheet0.getRow(1).getCell(0).getStringCellValue()).isEqualTo("APV-202609-001");
			assertThat(sheet0.getRow(1).getCell(1).getStringCellValue()).isEqualTo("2026-09-10");
			assertThat(sheet0.getRow(1).getCell(2).getStringCellValue()).isEqualTo("GENERATED");

			// Sheet 2 checks
			var sheet1 = workbook.getSheetAt(1);
			assertThat(sheet1.getRow(0).getCell(0).getStringCellValue()).isEqualTo("Local Voucher No.");
			assertThat(sheet1.getRow(1).getCell(0).getStringCellValue()).isEqualTo("APV-202609-001");
			assertThat(sheet1.getRow(1).getCell(1).getNumericCellValue()).isEqualTo(1.0);
			assertThat(sheet1.getRow(1).getCell(2).getNumericCellValue()).isEqualTo(1000.0);
		}
	}
}
