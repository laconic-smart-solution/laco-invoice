package com.laconic.lacoinvoice.features.invoice;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.openpdf.pdf.ITextRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;
import org.springframework.util.StringUtils;

import com.lowagie.text.DocumentException;
import com.lowagie.text.pdf.BaseFont;

/**
 * Renders tax invoice / receipt PDF via XHTML + OpenPDF HTML.
 */
@Service
public class InvoicePdfService {

	private static final DateTimeFormatter ISSUED_AT =
			DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm").withLocale(Locale.ENGLISH);

	private final Resource sansFontResource;
	private final Resource thaiFontResource;
	private final Resource templateResource;

	public InvoicePdfService(
			@Value("classpath:/fonts/NotoSans-Regular.ttf") Resource sansFontResource,
			@Value("classpath:/fonts/NotoSansThai-Regular.ttf") Resource thaiFontResource,
			@Value("classpath:/templates/invoice/tax-invoice.xhtml") Resource templateResource) {
		this.sansFontResource = sansFontResource;
		this.thaiFontResource = thaiFontResource;
		this.templateResource = templateResource;
	}

	public byte[] renderPdf(InvoiceDetailDto detail) {
		try {
			String body = buildBodyHtml(detail);
			String xhtml = loadTemplate().replace("__BODY__", body);
			return renderPdfDocument(xhtml);
		} catch (IOException e) {
			throw new IllegalStateException("Failed to render invoice PDF", e);
		}
	}

	/** @deprecated Use {@link #renderPdf(InvoiceDetailDto)}; kept for transition. */
	@Deprecated
	public String renderAndStore(com.laconic.lacoinvoice.domain.models.Invoice invoice) {
		return "/api/v1/invoices/" + invoice.getId() + "/pdf";
	}

	private String loadTemplate() throws IOException {
		try (Reader reader = new InputStreamReader(templateResource.getInputStream(), StandardCharsets.UTF_8)) {
			return FileCopyUtils.copyToString(reader);
		}
	}

	private String buildBodyHtml(InvoiceDetailDto detail) {
		InvoiceDto invoice = detail.invoice();
		StringBuilder sb = new StringBuilder();

		sb.append("<h1>Tax Invoice / Receipt</h1>");
		sb.append("<p class=\"subtitle\">ใบกำกับภาษี / ใบเสร็จรับเงิน</p>");

		sb.append("<table class=\"meta-table\"><tr><td>");
		sb.append("<p class=\"label\">Seller / ผู้ขาย</p>");
		sb.append("<p class=\"value\"><strong>")
				.append(escape(nz(detail.storeName(), "Store")))
				.append("</strong></p>");
		if (StringUtils.hasText(detail.marketplaceCode())) {
			sb.append("<p class=\"value\">Marketplace: ").append(escape(detail.marketplaceCode())).append("</p>");
		}

		sb.append("<p class=\"label\">Buyer / ผู้ซื้อ</p>");
		sb.append("<p class=\"value\"><strong>").append(escape(nz(detail.customerName(), "—"))).append("</strong></p>");
		if (StringUtils.hasText(detail.customerPhone())) {
			sb.append("<p class=\"value\">Tel: ").append(escape(detail.customerPhone())).append("</p>");
		}
		if (StringUtils.hasText(detail.customerEmail())) {
			sb.append("<p class=\"value\">Email: ").append(escape(detail.customerEmail())).append("</p>");
		}
		if (StringUtils.hasText(detail.customerAddress())) {
			sb.append("<p class=\"value\">").append(escape(detail.customerAddress())).append("</p>");
		}

		sb.append("</td><td>");
		sb.append("<p class=\"label\">Invoice No.</p>");
		sb.append("<p class=\"value\"><strong>")
				.append(escape(invoice != null ? nz(invoice.invoiceNo(), "—") : "—"))
				.append("</strong></p>");
		sb.append("<p class=\"label\">Issued</p>");
		sb.append("<p class=\"value\">").append(escape(formatIssued(invoice))).append("</p>");
		sb.append("<p class=\"label\">Order Ref.</p>");
		sb.append("<p class=\"value\">").append(escape(nz(detail.externalOrderId(), "—"))).append("</p>");
		sb.append("<p class=\"label\">Currency</p>");
		sb.append("<p class=\"value\">").append(escape(nz(detail.currency(), "THB"))).append("</p>");
		sb.append("</td></tr></table>");

		sb.append("<table class=\"lines\"><thead><tr>");
		sb.append("<th>#</th><th>Product</th><th>SKU</th>");
		sb.append("<th class=\"num\">Qty</th><th class=\"num\">Price</th><th class=\"num\">Amount</th>");
		sb.append("</tr></thead><tbody>");

		List<InvoiceLineItemDto> items = detail.items() != null ? detail.items() : List.of();
		int row = 1;
		for (InvoiceLineItemDto item : items) {
			sb.append("<tr>");
			sb.append("<td>").append(row++).append("</td>");
			sb.append("<td>").append(escape(nz(item.productName(), "—"))).append("</td>");
			sb.append("<td>").append(escape(nz(item.sku(), "—"))).append("</td>");
			sb.append("<td class=\"num\">").append(item.quantity() != null ? item.quantity() : 0).append("</td>");
			sb.append("<td class=\"num\">").append(formatMoney(item.price())).append("</td>");
			sb.append("<td class=\"num\">").append(formatMoney(item.lineTotal())).append("</td>");
			sb.append("</tr>");
		}
		if (items.isEmpty()) {
			sb.append("<tr><td colspan=\"6\">No line items</td></tr>");
		}
		sb.append("</tbody></table>");

		BigDecimal subtotal = invoice != null ? nullToZero(invoice.subtotal()) : BigDecimal.ZERO;
		BigDecimal shipping = nullToZero(detail.shippingFee());
		BigDecimal vat = invoice != null ? nullToZero(invoice.vatAmount()) : BigDecimal.ZERO;
		int vatPct = invoice != null && invoice.vatPercentage() != null ? invoice.vatPercentage() : 7;
		BigDecimal grand = invoice != null ? nullToZero(invoice.grandTotal()) : BigDecimal.ZERO;

		sb.append("<table class=\"totals\">");
		sb.append("<tr><td>Subtotal</td><td class=\"num\">").append(formatMoney(subtotal)).append("</td></tr>");
		sb.append("<tr><td>Shipping</td><td class=\"num\">").append(formatMoney(shipping)).append("</td></tr>");
		sb.append("<tr><td>VAT ").append(vatPct).append("%</td><td class=\"num\">")
				.append(formatMoney(vat)).append("</td></tr>");
		sb.append("<tr class=\"grand\"><td>Grand Total</td><td class=\"num\">")
				.append(formatMoney(grand)).append("</td></tr>");
		sb.append("</table>");

		sb.append("<p class=\"footer\">VAT calculated at ")
				.append(vatPct)
				.append("% on (subtotal + shipping). This document is a Tax Invoice / Receipt for marketplace order sync.</p>");

		return sb.toString();
	}

	private byte[] renderPdfDocument(String xhtml) {
		List<Path> tempFonts = new ArrayList<>();
		try {
			ITextRenderer renderer = new ITextRenderer();
			registerFont(renderer, sansFontResource, "invoice-sans-", "Noto Sans", tempFonts);
			registerFont(renderer, thaiFontResource, "invoice-thai-", "Noto Sans Thai", tempFonts);
			renderer.setDocumentFromString(xhtml);
			renderer.layout();
			try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
				renderer.createPDF(out);
				return out.toByteArray();
			}
		} catch (DocumentException | IOException e) {
			throw new IllegalStateException("Failed to render invoice PDF", e);
		} finally {
			for (Path path : tempFonts) {
				try {
					Files.deleteIfExists(path);
				} catch (IOException ignored) {
					path.toFile().deleteOnExit();
				}
			}
		}
	}

	private static void registerFont(
			ITextRenderer renderer,
			Resource font,
			String tempPrefix,
			String family,
			List<Path> tempFonts) throws IOException {
		if (font == null || !font.exists()) {
			return;
		}
		Path temp = Files.createTempFile(tempPrefix, ".ttf");
		tempFonts.add(temp);
		try (InputStream in = font.getInputStream()) {
			Files.copy(in, temp, StandardCopyOption.REPLACE_EXISTING);
		}
		renderer.getFontResolver().addFont(
				temp.toAbsolutePath().toString(),
				family,
				BaseFont.IDENTITY_H,
				true,
				null);
	}

	private static String formatIssued(InvoiceDto invoice) {
		if (invoice == null || invoice.issuedAt() == null) {
			return "—";
		}
		return ISSUED_AT.format(invoice.issuedAt().atZone(ZoneId.systemDefault()));
	}

	private static String formatMoney(BigDecimal value) {
		return nullToZero(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
	}

	private static BigDecimal nullToZero(BigDecimal value) {
		return value != null ? value : BigDecimal.ZERO;
	}

	private static String nz(String value, String fallback) {
		return StringUtils.hasText(value) ? value.trim() : fallback;
	}

	private static String escape(String value) {
		if (value == null) {
			return "";
		}
		return value
				.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;");
	}
}
