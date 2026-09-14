package com.laconic.lacoinvoice.common.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;

public final class ExcelExportWriter {

	public record SheetData(String sheetName, List<String> headers, List<List<Object>> rows) {
	}

	private static final DateTimeFormatter INSTANT_FORMAT =
			DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);
	private static final DateTimeFormatter DATE_FORMAT =
			DateTimeFormatter.ofPattern("yyyy-MM-dd");

	private ExcelExportWriter() {
	}

	public static byte[] write(String sheetName, List<String> headers, List<List<Object>> rows) {
		return writeSheets(List.of(new SheetData(sheetName, headers, rows)));
	}

	public static byte[] writeSheets(List<SheetData> sheets) {
		try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
				ByteArrayOutputStream out = new ByteArrayOutputStream()) {

			CellStyle headerStyle = workbook.createCellStyle();
			Font headerFont = workbook.createFont();
			headerFont.setBold(true);
			headerStyle.setFont(headerFont);

			for (SheetData sheetData : sheets) {
				String name = sheetData.sheetName();
				Sheet sheet = workbook.createSheet(name == null || name.isBlank() ? "Export" : name);

				Row headerRow = sheet.createRow(0);
				List<String> headers = sheetData.headers();
				for (int i = 0; i < headers.size(); i++) {
					Cell cell = headerRow.createCell(i);
					cell.setCellValue(headers.get(i));
					cell.setCellStyle(headerStyle);
				}

				int rowIndex = 1;
				for (List<Object> rowValues : sheetData.rows()) {
					Row row = sheet.createRow(rowIndex++);
					for (int col = 0; col < rowValues.size(); col++) {
						setCellValue(row.createCell(col), rowValues.get(col));
					}
				}
			}

			workbook.write(out);
			workbook.dispose();
			return out.toByteArray();
		} catch (IOException ex) {
			throw new BusinessRuleException("Unable to build Excel export.");
		}
	}

	private static void setCellValue(Cell cell, Object value) {
		if (value == null) {
			cell.setBlank();
			return;
		}
		if (value instanceof Number number) {
			cell.setCellValue(number.doubleValue());
			return;
		}
		if (value instanceof Boolean bool) {
			cell.setCellValue(bool);
			return;
		}
		if (value instanceof Instant instant) {
			cell.setCellValue(INSTANT_FORMAT.format(instant));
			return;
		}
		if (value instanceof LocalDate localDate) {
			cell.setCellValue(DATE_FORMAT.format(localDate));
			return;
		}
		if (value instanceof Enum<?> enumValue) {
			cell.setCellValue(enumValue.name());
			return;
		}
		cell.setCellValue(String.valueOf(value));
	}
}
