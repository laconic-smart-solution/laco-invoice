package com.laconic.lacoinvoice.features.order.inputrun;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class InvoicePdfParser {

	private static final Logger log = LoggerFactory.getLogger(InvoicePdfParser.class);

	private static final Pattern RECEIPT_NUMBER = Pattern.compile(
			"(?i)receipt\\s*(?:no\\.?|number)\\s*[:：]?\\s*([A-Z0-9][A-Z0-9\\-]{5,})");
	private static final Pattern RECEIPT_DATE = Pattern.compile(
			"(?i)receipt\\s*date\\s*[:：]?\\s*([^\\n\\r]+)");
	private static final Pattern PERIOD = Pattern.compile(
			"(?i)period\\s*[:：]?\\s*([^\\n\\r]+)");
	private static final Pattern ISSUER_TAX = Pattern.compile(
			"(?i)tax\\s+registration\\s+number\\s*[:：]?\\s*(\\d{10,13})");
	private static final Pattern BUYER_TAX = Pattern.compile(
			"(?i)(?:tax\\s*id|taxpayer\\s*id)\\s*[:：]?\\s*(\\d{10,13})");
	private static final Pattern TOTAL_AMOUNT = Pattern.compile(
			"(?i)total\\s*amount[^\\d฿]*฿?\\s*([\\d,]+(?:\\.\\d{1,2})?)");
	private static final Pattern BAHT_AMOUNT = Pattern.compile("฿\\s*([\\d,]+\\.\\d{2})");
	private static final Pattern WHT_RATE = Pattern.compile(
			"(?i)(?:withheld|withholding)[^%]{0,80}?(\\d+(?:\\.\\d+)?)\\s*%");
	private static final Pattern WHT_AMOUNT = Pattern.compile(
			"(?i)amounting to\\s*฿?\\s*([\\d,]+\\.\\d{2})");
	private static final Pattern COMPANY_LINE = Pattern.compile(
			"^\\s*(.+?(?:Ltd\\.?|Limited|Co\\.,?\\s*Ltd\\.?|บริษัท.+จำกัด).*)\\s*$",
			Pattern.MULTILINE | Pattern.CASE_INSENSITIVE);
	private static final Pattern DATE_TOKEN = Pattern.compile(
			"(?i)(?:january|february|march|april|may|june|july|august|september|october|november|december|"
					+ "jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\\s+\\d{1,2},?\\s+\\d{4}"
					+ "|\\d{1,2}\\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|"
					+ "jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\\s+\\d{4}"
					+ "|\\d{4}-\\d{2}-\\d{2}"
					+ "|\\d{1,2}/\\d{1,2}/\\d{4}");

	private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
			DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH),
			DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH),
			DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH),
			DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH),
			DateTimeFormatter.ofPattern("dd/MM/yyyy"),
			DateTimeFormatter.ofPattern("d/M/yyyy"),
			DateTimeFormatter.ISO_LOCAL_DATE,
			new DateTimeFormatterBuilder()
					.parseCaseInsensitive()
					.appendPattern("yyyy-MM-dd")
					.toFormatter(Locale.ENGLISH));

	public InvoicePdfExtract parse(byte[] content) {
		if (content == null || content.length == 0) {
			throw new IllegalArgumentException("Invoice PDF is empty.");
		}
		String text = extractText(content);
		if (!StringUtils.hasText(text)) {
			throw new IllegalArgumentException("Could not read any text from the invoice PDF.");
		}

		String issuerName = firstGroup(COMPANY_LINE, text);
		String buyerName = secondCompanyName(text, issuerName);

		return new InvoicePdfExtract(
				firstGroup(RECEIPT_NUMBER, text),
				parseDate(firstGroup(RECEIPT_DATE, text)),
				parsePeriodStart(text),
				parsePeriodEnd(text),
				trimToNull(issuerName),
				firstGroup(ISSUER_TAX, text),
				trimToNull(buyerName),
				firstBuyerTaxId(text),
				parseAmount(text),
				parseDecimal(firstGroup(WHT_AMOUNT, text)),
				parseRate(firstGroup(WHT_RATE, text)),
				text);
	}

	private String extractText(byte[] content) {
		try (PDDocument document = Loader.loadPDF(content)) {
			PDFTextStripper stripper = new PDFTextStripper();
			stripper.setSortByPosition(true);
			return stripper.getText(document);
		} catch (IOException ex) {
			log.warn("Failed to parse invoice PDF", ex);
			throw new IllegalArgumentException("The uploaded file is not a readable PDF.");
		}
	}

	private static String firstBuyerTaxId(String text) {
		Matcher issuer = ISSUER_TAX.matcher(text);
		String issuerTax = issuer.find() ? issuer.group(1) : null;
		Matcher buyer = BUYER_TAX.matcher(text);
		while (buyer.find()) {
			String value = buyer.group(1);
			if (issuerTax == null || !issuerTax.equals(value)) {
				return value;
			}
		}
		return null;
	}

	private static String secondCompanyName(String text, String issuerName) {
		Matcher matcher = COMPANY_LINE.matcher(text);
		boolean skippedIssuer = !StringUtils.hasText(issuerName);
		while (matcher.find()) {
			String value = matcher.group(1).trim();
			if (!skippedIssuer && value.equals(issuerName)) {
				skippedIssuer = true;
				continue;
			}
			if (skippedIssuer && StringUtils.hasText(value) && !value.equals(issuerName)) {
				return value;
			}
		}
		return null;
	}

	private static LocalDate parsePeriodStart(String text) {
		String period = firstGroup(PERIOD, text);
		if (!StringUtils.hasText(period)) {
			return null;
		}
		String[] parts = period.split("\\s*(?:-|–|to|→)\\s*", 2);
		return parseDate(parts[0]);
	}

	private static LocalDate parsePeriodEnd(String text) {
		String period = firstGroup(PERIOD, text);
		if (!StringUtils.hasText(period)) {
			return null;
		}
		String[] parts = period.split("\\s*(?:-|–|to|→)\\s*", 2);
		return parseDate(parts.length > 1 ? parts[1] : parts[0]);
	}

	private static BigDecimal parseAmount(String text) {
		BigDecimal labeled = parseDecimal(firstGroup(TOTAL_AMOUNT, text));
		if (labeled != null) {
			return labeled;
		}
		Matcher matcher = BAHT_AMOUNT.matcher(text);
		BigDecimal last = null;
		while (matcher.find()) {
			last = parseDecimal(matcher.group(1));
		}
		return last;
	}

	private static BigDecimal parseRate(String value) {
		BigDecimal percent = parseDecimal(value);
		if (percent == null) {
			return null;
		}
		return percent.compareTo(BigDecimal.ONE) > 0
				? percent.movePointLeft(2)
				: percent;
	}

	private static BigDecimal parseDecimal(String raw) {
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		try {
			return new BigDecimal(raw.replace(",", "").trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private static LocalDate parseDate(String raw) {
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		String cleaned = raw.replaceAll("\\s+", " ").trim();
		LocalDate parsed = tryParseDate(cleaned);
		if (parsed != null) {
			return parsed;
		}
		Matcher matcher = DATE_TOKEN.matcher(cleaned);
		if (matcher.find()) {
			return tryParseDate(matcher.group());
		}
		return null;
	}

	private static LocalDate tryParseDate(String value) {
		for (DateTimeFormatter formatter : DATE_FORMATS) {
			try {
				return LocalDate.parse(value, formatter);
			} catch (DateTimeParseException ignored) {
				// try next
			}
		}
		return null;
	}

	private static String firstGroup(Pattern pattern, String text) {
		Matcher matcher = pattern.matcher(text);
		if (!matcher.find()) {
			return null;
		}
		return trimToNull(matcher.group(1));
	}

	private static String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
