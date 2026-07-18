package com.laconic.lacoinvoice.features.invoice;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import com.laconic.lacoinvoice.domain.models.InvoiceStatus;

class InvoicePdfServiceTest {

	@Test
	void rendersPdfWithThaiText() {
		InvoicePdfService service = new InvoicePdfService(
				new ClassPathResource("fonts/NotoSans-Regular.ttf"),
				new ClassPathResource("fonts/NotoSansThai-Regular.ttf"),
				new ClassPathResource("templates/invoice/tax-invoice.xhtml"));

		InvoiceDto invoice = new InvoiceDto(
				1L,
				10L,
				"INV-202607-000001",
				new BigDecimal("1000.00"),
				new BigDecimal("77.00"),
				7,
				new BigDecimal("1177.00"),
				InvoiceStatus.ISSUED,
				"/api/v1/invoices/1/pdf",
				Instant.parse("2026-07-18T05:00:00Z"),
				Instant.parse("2026-07-18T05:00:00Z"));

		InvoiceDetailDto detail = new InvoiceDetailDto(
				invoice,
				1L,
				"Demo Store",
				"LAZADA",
				"LAZ-1001",
				"THB",
				new BigDecimal("100.00"),
				"สมชาย ใจดี",
				"buyer@example.com",
				"0812345678",
				"Bangkok",
				List.of(new InvoiceLineItemDto(
						1L,
						"SKU-1",
						"สินค้าทดสอบ",
						new BigDecimal("1000.00"),
						1,
						new BigDecimal("1000.00"))));

		byte[] pdf = service.renderPdf(detail);
		assertTrue(pdf.length > 500, "PDF should contain content");
		assertTrue(pdf[0] == '%' && pdf[1] == 'P' && pdf[2] == 'D' && pdf[3] == 'F', "Should start with %PDF");
	}
}
