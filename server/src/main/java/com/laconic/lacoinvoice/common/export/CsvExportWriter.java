package com.laconic.lacoinvoice.common.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;

public final class CsvExportWriter {

	private static final DateTimeFormatter INSTANT_FORMAT =
			DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);
	private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

	// UTF-8 BOM for Microsoft Excel compatibility
	private static final byte[] UTF8_BOM = new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF };

	private CsvExportWriter() {
	}

	public static byte[] write(List<String> headers, List<List<Object>> rows) {
		return write(headers, rows, true);
	}

	public static byte[] write(List<String> headers, List<List<Object>> rows, boolean includeBom) {
		try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			if (includeBom) {
				out.write(UTF8_BOM);
			}
			try (Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {
				// Write headers
				writeRow(writer, headers);

				// Write rows
				for (List<Object> rowValues : rows) {
					writeRow(writer, rowValues);
				}
				writer.flush();
			}
			return out.toByteArray();
		} catch (IOException ex) {
			throw new BusinessRuleException("Unable to build CSV export.");
		}
	}

	private static void writeRow(Writer writer, List<?> values) throws IOException {
		for (int i = 0; i < values.size(); i++) {
			if (i > 0) {
				writer.write(',');
			}
			writer.write(formatCsvValue(values.get(i)));
		}
		writer.write("\r\n");
	}

	private static String formatCsvValue(Object value) {
		if (value == null) {
			return "";
		}
		String raw;
		if (value instanceof Instant instant) {
			raw = INSTANT_FORMAT.format(instant);
		} else if (value instanceof LocalDate localDate) {
			raw = DATE_FORMAT.format(localDate);
		} else if (value instanceof Enum<?> enumValue) {
			raw = enumValue.name();
		} else {
			raw = String.valueOf(value);
		}

		boolean needsQuotes = raw.contains(",") || raw.contains("\"") || raw.contains("\n") || raw.contains("\r");
		if (!needsQuotes) {
			return raw;
		}

		return "\"" + raw.replace("\"", "\"\"") + "\"";
	}
}
