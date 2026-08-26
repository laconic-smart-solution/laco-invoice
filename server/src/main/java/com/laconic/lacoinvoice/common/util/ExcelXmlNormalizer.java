package com.laconic.lacoinvoice.common.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Normalizes XLSX (OpenXML) workbooks that contain non-standard XML formatting,
 * such as TikTok exports where each column/cell is emitted in its own separate
 * duplicate &lt;row r="N"&gt; element instead of grouping all cells in one row.
 */
public final class ExcelXmlNormalizer {

	private static final Logger log = LoggerFactory.getLogger(ExcelXmlNormalizer.class);

	private static final Pattern ROW_PATTERN = Pattern.compile(
			"(<row\\b[^>]*\\br=\"(\\d+)\"[^>]*)(?:/>|>(.*?)</row>)",
			Pattern.DOTALL | Pattern.CASE_INSENSITIVE);

	private ExcelXmlNormalizer() {
	}

	/**
	 * Pre-processes an XLSX input stream. If the stream is a ZIP archive containing
	 * duplicate row tags in any worksheet, returns a normalized stream where duplicate
	 * row tags for the same row index are merged. Otherwise, returns a stream over the
	 * original bytes.
	 */
	public static InputStream normalize(InputStream input) {
		if (input == null) {
			return null;
		}
		try {
			byte[] bytes = input.readAllBytes();
			byte[] normalized = normalize(bytes);
			return new ByteArrayInputStream(normalized);
		} catch (Exception ex) {
			log.warn("Failed to normalize Excel stream; proceeding with original: {}", ex.getMessage());
			return input;
		}
	}

	/**
	 * Normalizes an XLSX byte array in memory.
	 */
	public static byte[] normalize(byte[] inputBytes) {
		if (inputBytes == null || inputBytes.length < 4) {
			return inputBytes;
		}
		// Check for ZIP local file header signature: PK\x03\x04
		if (inputBytes[0] != 0x50 || inputBytes[1] != 0x4B || inputBytes[2] != 0x03 || inputBytes[3] != 0x04) {
			return inputBytes;
		}

		try {
			ByteArrayOutputStream baos = new ByteArrayOutputStream(inputBytes.length);
			boolean modified = false;

			try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(inputBytes));
					ZipOutputStream zos = new ZipOutputStream(baos)) {

				ZipEntry entry;
				while ((entry = zis.getNextEntry()) != null) {
					ZipEntry newEntry = new ZipEntry(entry.getName());
					if (entry.getTime() != -1) {
						newEntry.setTime(entry.getTime());
					}
					zos.putNextEntry(newEntry);
					byte[] entryBytes = zis.readAllBytes();

					if (entry.getName().startsWith("xl/worksheets/") && entry.getName().endsWith(".xml")) {
						String xml = new String(entryBytes, StandardCharsets.UTF_8);
						if (xml.contains("<sheetData>") && xml.contains("</row><row")) {
							String fixed = fixDuplicateRowTags(xml);
							if (!fixed.equals(xml)) {
								entryBytes = fixed.getBytes(StandardCharsets.UTF_8);
								modified = true;
							}
						}
					}
					zos.write(entryBytes);
					zos.closeEntry();
				}
			}

			return modified ? baos.toByteArray() : inputBytes;
		} catch (Exception ex) {
			log.warn("Excel normalization skipped due to error: {}", ex.getMessage());
			return inputBytes;
		}
	}

	/**
	 * Merges consecutive &lt;row r="N"&gt; tags with the same row number inside
	 * &lt;sheetData&gt;.
	 */
	static String fixDuplicateRowTags(String xml) {
		int sheetDataStart = xml.indexOf("<sheetData");
		if (sheetDataStart == -1) {
			return xml;
		}
		int contentStart = xml.indexOf('>', sheetDataStart);
		if (contentStart == -1) {
			return xml;
		}
		contentStart += 1;

		int sheetDataEnd = xml.indexOf("</sheetData>", contentStart);
		if (sheetDataEnd == -1) {
			return xml;
		}

		String pre = xml.substring(0, contentStart);
		String post = xml.substring(sheetDataEnd);
		String sheetDataContent = xml.substring(contentStart, sheetDataEnd);

		Matcher matcher = ROW_PATTERN.matcher(sheetDataContent);
		StringBuilder fixed = new StringBuilder(sheetDataContent.length());
		int currentR = -1;
		boolean inRow = false;

		while (matcher.find()) {
			String openTag = matcher.group(1);
			int r = Integer.parseInt(matcher.group(2));
			String cells = matcher.group(3);

			if (r == currentR && inRow) {
				if (cells != null) {
					fixed.append(cells);
				}
			} else {
				if (inRow) {
					fixed.append("</row>");
				}
				fixed.append(openTag).append('>');
				if (cells != null) {
					fixed.append(cells);
				}
				currentR = r;
				inRow = true;
			}
		}

		if (inRow) {
			fixed.append("</row>");
		}

		return pre + fixed.toString() + post;
	}
}
