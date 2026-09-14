package com.laconic.lacoinvoice.common.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

import com.laconic.lacoinvoice.common.export.VoucherPdfWriter.VoucherLinePdfModel;
import com.laconic.lacoinvoice.common.export.VoucherPdfWriter.VoucherPdfModel;

class VoucherPdfWriterTest {

	@Test
	void write_generatesValidPdfDocumentWithAccountingStandardLayout() throws Exception {
		List<VoucherLinePdfModel> lines = List.of(
				new VoucherLinePdfModel(
						1,
						"2101-000",
						"Accounts Payable",
						"AC - Accounting",
						"Payment for Shopee ad invoice",
						"INV-202608-008",
						new BigDecimal("2500.00"),
						BigDecimal.ZERO
				),
				new VoucherLinePdfModel(
						2,
						"1101-000",
						"Bank - Kasikorn",
						"AC - Accounting",
						"Bank transfer payment",
						null,
						BigDecimal.ZERO,
						new BigDecimal("2500.00")
				)
		);

		VoucherPdfModel voucher = new VoucherPdfModel(
				"PV-202608-001",
				"ERP-PV-9988",
				"PV",
				"PAYMENT VOUCHER",
				LocalDate.of(2026, 8, 15),
				LocalDate.of(2026, 8, 1),
				LocalDate.of(2026, 8, 1),
				"Tiktok Shop (2) By Dev Alvin",
				"THB",
				"GENERATED",
				"Shopee advertising fee payment clearing",
				"Full payment settled via Kasikorn bank transfer",
				"FG-ADS - Advertising Fee",
				"V-SHOPEE - Shopee (Thailand)",
				"KBANK-TX-882194",
				"INV-202608-008",
				new BigDecimal("2500.00"),
				new BigDecimal("2500.00"),
				lines
		);

		byte[] pdfBytes = VoucherPdfWriter.write(List.of(voucher));
		assertThat(pdfBytes).isNotNull().isNotEmpty();

		// Check PDF magic header %PDF-
		String header = new String(pdfBytes, 0, 5);
		assertThat(header).isEqualTo("%PDF-");

		// Read back using PDFBox to verify validity
		try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
			assertThat(doc.getNumberOfPages()).isEqualTo(1);

			PDFTextStripper stripper = new PDFTextStripper();
			String text = stripper.getText(doc);

			assertThat(text).contains("PAYMENT VOUCHER");
			assertThat(text).contains("PV-202608-001");
			assertThat(text).contains("2101-000");
			assertThat(text).contains("Accounts Payable");
			assertThat(text).contains("Bank - Kasikorn");
			assertThat(text).contains("2,500.00");
			assertThat(text).contains("Prepared By");
			assertThat(text).contains("Approved By");
		}
	}
}
