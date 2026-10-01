package com.laconic.lacoinvoice.common.export;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;

public final class VoucherPdfWriter {

	private static final ZoneId BANGKOK_ZONE = ZoneId.of("Asia/Bangkok");
	private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final DateTimeFormatter TIMESTAMP_FMT =
			DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(BANGKOK_ZONE);
	private static final DecimalFormat MONEY_FMT = new DecimalFormat("#,##0.00");

	// A4 Dimensions (595.28 x 841.89)
	private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
	private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
	private static final float MARGIN_LEFT = 36f;
	private static final float MARGIN_RIGHT = 36f;
	private static final float CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 523.28f

	// Palette
	private static final Color COLOR_PRIMARY = new Color(15, 23, 42); // slate-900
	private static final Color COLOR_SECONDARY = new Color(71, 85, 105); // slate-600
	private static final Color COLOR_MUTED = new Color(148, 163, 184); // slate-400
	private static final Color COLOR_BORDER = new Color(226, 232, 240); // slate-200
	private static final Color COLOR_BG_LIGHT = new Color(248, 250, 252); // slate-50
	private static final Color COLOR_HEADER_FILL = new Color(30, 41, 59); // slate-800
	private static final Color COLOR_ZEBRA = new Color(250, 250, 250);

	public record VoucherPdfModel(
			String voucherNumber,
			String erpVoucherNo,
			String category,
			String categoryTitle,
			LocalDate voucherDate,
			LocalDate taxMonth,
			LocalDate whtMonth,
			String storeName,
			String currency,
			String status,
			String voucherBrief,
			String voucherDescription,
			String itemName,
			String vendorName,
			String chequeTransferNo,
			String invoiceNo,
			BigDecimal debitTotal,
			BigDecimal creditTotal,
			List<VoucherLinePdfModel> lines) {
	}

	public record VoucherLinePdfModel(
			int lineNo,
			String accountCode,
			String accountName,
			String departmentName,
			String note,
			String invoiceNo,
			BigDecimal debit,
			BigDecimal credit) {
	}

	private VoucherPdfWriter() {
	}

	public static byte[] write(List<VoucherPdfModel> vouchers) {
		if (vouchers == null || vouchers.isEmpty()) {
			throw new BusinessRuleException("No vouchers provided for PDF generation.");
		}

		try (PDDocument document = new PDDocument();
				ByteArrayOutputStream out = new ByteArrayOutputStream()) {

			PDFont fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
			PDFont fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
			PDFont fontOblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

			for (VoucherPdfModel voucher : vouchers) {
				renderVoucher(document, voucher, fontRegular, fontBold, fontOblique);
			}

			document.save(out);
			return out.toByteArray();
		} catch (IOException ex) {
			throw new BusinessRuleException("Unable to build Voucher PDF: " + ex.getMessage());
		}
	}

	private static void renderVoucher(
			PDDocument document,
			VoucherPdfModel voucher,
			PDFont fontRegular,
			PDFont fontBold,
			PDFont fontOblique) throws IOException {

		PDPage page = new PDPage(PDRectangle.A4);
		document.addPage(page);

		try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
			float y = PAGE_HEIGHT - 36f;

			// Top Brand & Title Bar
			y = drawHeader(cs, voucher, y, fontRegular, fontBold);

			// Voucher Metadata Grid Box
			y = drawMetadataGrid(cs, voucher, y, fontRegular, fontBold);

			// Journal Entries Table
			y = drawJournalTable(cs, voucher, y, fontRegular, fontBold);

			// Signature & Approval Block
			drawSignatureBlock(cs, fontRegular, fontBold);

			// Bottom Audit Footer
			drawFooter(cs, voucher, fontRegular, fontOblique);
		}
	}

	private static float drawHeader(
			PDPageContentStream cs,
			VoucherPdfModel voucher,
			float topY,
			PDFont fontRegular,
			PDFont fontBold) throws IOException {

		float y = topY;

		// Store / App name
		String storeLabel = voucher.storeName() != null && !voucher.storeName().isBlank()
				? voucher.storeName().toUpperCase()
				: "LACO INVOICE";

		cs.setNonStrokingColor(COLOR_SECONDARY);
		drawText(cs, fontBold, 8.5f, MARGIN_LEFT, y, storeLabel);

		// Category Title (e.g. PAYMENT VOUCHER)
		y -= 18f;
		String title = voucher.categoryTitle() != null ? voucher.categoryTitle() : "GENERAL JOURNAL VOUCHER";
		cs.setNonStrokingColor(COLOR_PRIMARY);
		drawText(cs, fontBold, 16f, MARGIN_LEFT, y, title);

		// Status Badge (Top-Right)
		String status = voucher.status() != null ? voucher.status() : "GENERATED";
		float badgeWidth = 76f;
		float badgeHeight = 18f;
		float badgeX = MARGIN_LEFT + CONTENT_WIDTH - badgeWidth;
		float badgeY = y - 2f;

		// Badge Background
		Color badgeBg = "POSTED".equalsIgnoreCase(status) ? new Color(220, 252, 231) : new Color(241, 245, 249);
		Color badgeText = "POSTED".equalsIgnoreCase(status) ? new Color(22, 101, 52) : new Color(51, 65, 85);
		drawFilledRect(cs, badgeX, badgeY, badgeWidth, badgeHeight, badgeBg);
		drawStrokeRect(cs, badgeX, badgeY, badgeWidth, badgeHeight, COLOR_BORDER, 0.5f);

		cs.setNonStrokingColor(badgeText);
		float textWidth = getTextWidth(fontBold, 8f, status);
		drawText(cs, fontBold, 8f, badgeX + (badgeWidth - textWidth) / 2f, badgeY + 5.5f, status);

		// Divider
		y -= 10f;
		cs.setStrokingColor(COLOR_BORDER);
		cs.setLineWidth(1f);
		cs.moveTo(MARGIN_LEFT, y);
		cs.lineTo(MARGIN_LEFT + CONTENT_WIDTH, y);
		cs.stroke();

		return y - 8f;
	}

	private static float drawMetadataGrid(
			PDPageContentStream cs,
			VoucherPdfModel voucher,
			float topY,
			PDFont fontRegular,
			PDFont fontBold) throws IOException {

		float boxHeight = 84f;
		float y = topY - boxHeight;

		// Draw card box
		drawFilledRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, boxHeight, COLOR_BG_LIGHT);
		drawStrokeRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, boxHeight, COLOR_BORDER, 0.75f);

		float col1X = MARGIN_LEFT + 10f;
		float col2X = MARGIN_LEFT + (CONTENT_WIDTH / 2f) + 10f;
		float rowY = topY - 14f;
		float rowSpacing = 14f;

		// Left Column: Voucher No, ERP Voucher No, Date, Tax Month, Currency
		drawField(cs, "Voucher No:", safeString(voucher.voucherNumber()), col1X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "ERP Voucher No:", safeString(voucher.erpVoucherNo(), "-"), col1X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "Voucher Date:", formatDate(voucher.voucherDate()), col1X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "Tax / WHT Month:", formatDate(voucher.taxMonth()), col1X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "Currency:", safeString(voucher.currency(), "THB"), col1X, rowY, fontRegular, fontBold);

		// Right Column: Vendor, ERP Item, Linked Invoice, Cheque/Transfer Ref
		rowY = topY - 14f;
		drawField(cs, "Vendor / Payee:", truncate(safeString(voucher.vendorName(), "-"), 32), col2X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "ERP Item / SKU:", truncate(safeString(voucher.itemName(), "-"), 32), col2X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "Invoice Ref:", safeString(voucher.invoiceNo(), "-"), col2X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "Payment Ref No:", safeString(voucher.chequeTransferNo(), "-"), col2X, rowY, fontRegular, fontBold);
		rowY -= rowSpacing;
		drawField(cs, "Category:", safeString(voucher.category(), "GL"), col2X, rowY, fontRegular, fontBold);

		y -= 8f;

		// Brief Note Banner if present
		if (voucher.voucherBrief() != null && !voucher.voucherBrief().isBlank()) {
			float briefBoxH = 20f;
			y -= briefBoxH;
			drawFilledRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, briefBoxH, Color.WHITE);
			drawStrokeRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, briefBoxH, COLOR_BORDER, 0.5f);
			drawField(cs, "Brief:", truncate(voucher.voucherBrief(), 80), MARGIN_LEFT + 8f, y + 6f, fontRegular, fontBold);
			y -= 8f;
		}

		return y;
	}

	private static float drawJournalTable(
			PDPageContentStream cs,
			VoucherPdfModel voucher,
			float topY,
			PDFont fontRegular,
			PDFont fontBold) throws IOException {

		float y = topY;

		// Columns widths: total = 523.28
		float colLineW = 24f;
		float colAccountW = 165f;
		float colDeptW = 60f;
		float colDescW = 134f;
		float colDebitW = 70f;
		float colCreditW = 70f;

		float headerH = 18f;
		y -= headerH;

		// Table Header Fill
		drawFilledRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, headerH, COLOR_HEADER_FILL);

		cs.setNonStrokingColor(Color.WHITE);
		float textY = y + 5.5f;
		drawText(cs, fontBold, 8f, MARGIN_LEFT + 4f, textY, "#");
		drawText(cs, fontBold, 8f, MARGIN_LEFT + colLineW + 4f, textY, "GL Account");
		drawText(cs, fontBold, 8f, MARGIN_LEFT + colLineW + colAccountW + 4f, textY, "Dept");
		drawText(cs, fontBold, 8f, MARGIN_LEFT + colLineW + colAccountW + colDeptW + 4f, textY, "Description / Note");
		drawRightAlignedText(cs, fontBold, 8f, MARGIN_LEFT + colLineW + colAccountW + colDeptW + colDescW + colDebitW - 4f, textY, "Debit");
		drawRightAlignedText(cs, fontBold, 8f, MARGIN_LEFT + CONTENT_WIDTH - 4f, textY, "Credit");

		// Table Rows
		float rowH = 17f;
		List<VoucherLinePdfModel> lines = voucher.lines() != null ? voucher.lines() : List.of();
		boolean zebra = false;

		for (VoucherLinePdfModel line : lines) {
			y -= rowH;
			if (zebra) {
				drawFilledRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, rowH, COLOR_ZEBRA);
			}
			zebra = !zebra;

			// Row bottom border
			drawStrokeRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, rowH, COLOR_BORDER, 0.4f);

			float rowTextY = y + 5f;
			cs.setNonStrokingColor(COLOR_PRIMARY);

			// Line number
			drawText(cs, fontRegular, 8f, MARGIN_LEFT + 4f, rowTextY, String.valueOf(line.lineNo()));

			// Account (code + name)
			String acct = safeString(line.accountCode()) + (line.accountName() != null ? " " + line.accountName() : "");
			drawText(cs, fontRegular, 7.5f, MARGIN_LEFT + colLineW + 4f, rowTextY, truncate(acct, 34));

			// Dept
			drawText(cs, fontRegular, 7.5f, MARGIN_LEFT + colLineW + colAccountW + 4f, rowTextY, truncate(safeString(line.departmentName(), "-"), 12));

			// Note / Description
			String note = safeString(line.note(), safeString(line.invoiceNo(), "-"));
			drawText(cs, fontRegular, 7.5f, MARGIN_LEFT + colLineW + colAccountW + colDeptW + 4f, rowTextY, truncate(note, 26));

			// Debit
			BigDecimal debit = line.debit() != null ? line.debit() : BigDecimal.ZERO;
			String debitStr = debit.signum() > 0 ? MONEY_FMT.format(debit) : "-";
			drawRightAlignedText(cs, fontRegular, 8f, MARGIN_LEFT + colLineW + colAccountW + colDeptW + colDescW + colDebitW - 4f, rowTextY, debitStr);

			// Credit
			BigDecimal credit = line.credit() != null ? line.credit() : BigDecimal.ZERO;
			String creditStr = credit.signum() > 0 ? MONEY_FMT.format(credit) : "-";
			drawRightAlignedText(cs, fontRegular, 8f, MARGIN_LEFT + CONTENT_WIDTH - 4f, rowTextY, creditStr);
		}

		// Total Row
		float totalH = 20f;
		y -= totalH;
		drawFilledRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, totalH, COLOR_BG_LIGHT);
		drawStrokeRect(cs, MARGIN_LEFT, y, CONTENT_WIDTH, totalH, COLOR_BORDER, 0.75f);

		float totalTextY = y + 6f;
		cs.setNonStrokingColor(COLOR_PRIMARY);
		drawText(cs, fontBold, 8.5f, MARGIN_LEFT + colLineW + 4f, totalTextY, "TOTAL (" + safeString(voucher.currency(), "THB") + ")");

		BigDecimal debitTotal = voucher.debitTotal() != null ? voucher.debitTotal() : BigDecimal.ZERO;
		BigDecimal creditTotal = voucher.creditTotal() != null ? voucher.creditTotal() : BigDecimal.ZERO;

		float debitX = MARGIN_LEFT + colLineW + colAccountW + colDeptW + colDescW + colDebitW - 4f;
		float creditX = MARGIN_LEFT + CONTENT_WIDTH - 4f;

		drawRightAlignedText(cs, fontBold, 8.5f, debitX, totalTextY, MONEY_FMT.format(debitTotal));
		drawRightAlignedText(cs, fontBold, 8.5f, creditX, totalTextY, MONEY_FMT.format(creditTotal));

		// Accounting Double Underline below totals
		cs.setStrokingColor(COLOR_PRIMARY);
		cs.setLineWidth(0.6f);
		cs.moveTo(debitX - colDebitW + 8f, y + 2.5f);
		cs.lineTo(debitX, y + 2.5f);
		cs.moveTo(debitX - colDebitW + 8f, y + 1f);
		cs.lineTo(debitX, y + 1f);

		cs.moveTo(creditX - colCreditW + 8f, y + 2.5f);
		cs.lineTo(creditX, y + 2.5f);
		cs.moveTo(creditX - colCreditW + 8f, y + 1f);
		cs.lineTo(creditX, y + 1f);
		cs.stroke();

		return y;
	}

	private static void drawSignatureBlock(
			PDPageContentStream cs,
			PDFont fontRegular,
			PDFont fontBold) throws IOException {

		float boxH = 68f;
		float boxY = 60f; // Fixed distance from bottom
		float totalW = CONTENT_WIDTH;
		int cols = 4;
		float gap = 6f;
		float colW = (totalW - (gap * (cols - 1))) / cols;

		String[] titles = {
				"Prepared By",
				"Checked By",
				"Approved By",
				"Received / Paid By"
		};

		String[] subtitles = {
				"(ผู้จัดทำ)",
				"(ผู้ตรวจสอบ)",
				"(ผู้อนุมัติ)",
				"(ผู้รับเงิน/จ่ายเงิน)"
		};

		for (int i = 0; i < cols; i++) {
			float bx = MARGIN_LEFT + (i * (colW + gap));
			drawFilledRect(cs, bx, boxY, colW, boxH, COLOR_BG_LIGHT);
			drawStrokeRect(cs, bx, boxY, colW, boxH, COLOR_BORDER, 0.5f);

			// Title
			cs.setNonStrokingColor(COLOR_PRIMARY);
			float tw = getTextWidth(fontBold, 7.5f, titles[i]);
			drawText(cs, fontBold, 7.5f, bx + (colW - tw) / 2f, boxY + boxH - 12f, titles[i]);

			// Subtitle (Thai hint)
			cs.setNonStrokingColor(COLOR_MUTED);
			float stw = getTextWidth(fontRegular, 6.5f, subtitles[i]);
			drawText(cs, fontRegular, 6.5f, bx + (colW - stw) / 2f, boxY + boxH - 21f, subtitles[i]);

			// Signature dotted line
			cs.setStrokingColor(COLOR_BORDER);
			cs.setLineWidth(0.6f);
			float lineY = boxY + 20f;
			cs.moveTo(bx + 10f, lineY);
			cs.lineTo(bx + colW - 10f, lineY);
			cs.stroke();

			// Date label
			cs.setNonStrokingColor(COLOR_SECONDARY);
			drawText(cs, fontRegular, 6.5f, bx + 12f, boxY + 8f, "Date: _____/_____/_________");
		}
	}

	private static void drawFooter(
			PDPageContentStream cs,
			VoucherPdfModel voucher,
			PDFont fontRegular,
			PDFont fontOblique) throws IOException {

		float y = 32f;
		cs.setNonStrokingColor(COLOR_MUTED);

		String generatedOn = "Generated by Laco Invoice on " + TIMESTAMP_FMT.format(Instant.now());
		drawText(cs, fontOblique, 7f, MARGIN_LEFT, y, generatedOn);

		String pageNum = "Original Accounting Copy";
		float pnw = getTextWidth(fontRegular, 7f, pageNum);
		drawText(cs, fontRegular, 7f, MARGIN_LEFT + CONTENT_WIDTH - pnw, y, pageNum);
	}

	// Utility Drawing Helpers

	private static void drawField(
			PDPageContentStream cs,
			String label,
			String value,
			float x,
			float y,
			PDFont fontRegular,
			PDFont fontBold) throws IOException {

		cs.setNonStrokingColor(COLOR_MUTED);
		drawText(cs, fontBold, 7.5f, x, y, label);

		float labelW = getTextWidth(fontBold, 7.5f, label) + 4f;
		cs.setNonStrokingColor(COLOR_PRIMARY);
		drawText(cs, fontRegular, 7.5f, x + labelW, y, value);
	}

	private static void drawText(
			PDPageContentStream cs,
			PDFont font,
			float fontSize,
			float x,
			float y,
			String text) throws IOException {

		if (text == null || text.isBlank()) {
			return;
		}
		// Replace characters that Standard14 Helvetica cannot render to prevent encoding exceptions
		String sanitized = sanitizeForHelvetica(text);
		cs.beginText();
		cs.setFont(font, fontSize);
		cs.newLineAtOffset(x, y);
		cs.showText(sanitized);
		cs.endText();
	}

	private static void drawRightAlignedText(
			PDPageContentStream cs,
			PDFont font,
			float fontSize,
			float rightX,
			float y,
			String text) throws IOException {

		if (text == null || text.isBlank()) {
			return;
		}
		String sanitized = sanitizeForHelvetica(text);
		float width = getTextWidth(font, fontSize, sanitized);
		drawText(cs, font, fontSize, rightX - width, y, sanitized);
	}

	private static void drawFilledRect(
			PDPageContentStream cs,
			float x,
			float y,
			float width,
			float height,
			Color color) throws IOException {

		cs.setNonStrokingColor(color);
		cs.addRect(x, y, width, height);
		cs.fill();
	}

	private static void drawStrokeRect(
			PDPageContentStream cs,
			float x,
			float y,
			float width,
			float height,
			Color color,
			float lineWidth) throws IOException {

		cs.setStrokingColor(color);
		cs.setLineWidth(lineWidth);
		cs.addRect(x, y, width, height);
		cs.stroke();
	}

	private static float getTextWidth(PDFont font, float fontSize, String text) {
		if (text == null || text.isEmpty()) {
			return 0f;
		}
		try {
			return font.getStringWidth(sanitizeForHelvetica(text)) / 1000f * fontSize;
		} catch (IOException e) {
			return text.length() * fontSize * 0.5f;
		}
	}

	private static String sanitizeForHelvetica(String input) {
		if (input == null) {
			return "";
		}
		StringBuilder sb = new StringBuilder();
		for (char c : input.toCharArray()) {
			// Basic ASCII printables + Latin-1 supplement that Helvetica supports
			if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255)) {
				sb.append(c);
			} else {
				sb.append(' ');
			}
		}
		return sb.toString();
	}

	private static String safeString(String s) {
		return s == null ? "" : s.trim();
	}

	private static String safeString(String s, String fallback) {
		return s == null || s.isBlank() ? fallback : s.trim();
	}

	private static String formatDate(LocalDate date) {
		return date != null ? DATE_FMT.format(date) : "-";
	}

	private static String truncate(String s, int maxLen) {
		if (s == null) {
			return "";
		}
		String trimmed = s.trim();
		if (trimmed.length() <= maxLen) {
			return trimmed;
		}
		return trimmed.substring(0, maxLen - 2) + "..";
	}
}
