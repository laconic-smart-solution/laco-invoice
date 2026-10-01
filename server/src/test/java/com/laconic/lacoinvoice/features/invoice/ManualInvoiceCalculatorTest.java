package com.laconic.lacoinvoice.features.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.laconic.lacoinvoice.features.invoice.dto.ManualInvoiceLineRequest;
import com.laconic.lacoinvoice.features.invoice.dto.ManualInvoicePreviewDto;
import com.laconic.lacoinvoice.features.invoice.dto.ManualInvoiceRequest;

class ManualInvoiceCalculatorTest {

	@Test
	void calculatesLineTotalsVatAndGrandTotalWithHalfUpRounding() {
		ManualInvoiceRequest request = request(
				line("Widget", 2, "10.005", "0.01"),
				line("Gadget", 1, "3.333", "0"));

		ManualInvoicePreviewDto preview = ManualInvoiceCalculator.calculate(request);

		assertThat(preview.itemCount()).isEqualTo(3);
		assertThat(preview.subtotal()).isEqualByComparingTo("23.34");
		assertThat(preview.vatRate()).isEqualByComparingTo("0.0700");
		assertThat(preview.vatAmount()).isEqualByComparingTo("1.63");
		assertThat(preview.grandTotal()).isEqualByComparingTo("24.97");
		assertThat(preview.currency()).isEqualTo("THB");
		assertThat(preview.lines()).hasSize(2);
		assertThat(preview.lines().get(0).subtotal()).isEqualByComparingTo("20.02");
		assertThat(preview.lines().get(0).totalAmount()).isEqualByComparingTo("20.01");
		assertThat(preview.lines().get(1).totalAmount()).isEqualByComparingTo("3.33");
	}

	@Test
	void rejectsDiscountGreaterThanLineSubtotal() {
		ManualInvoiceRequest request = request(line("Widget", 1, "10.00", "10.01"));

		assertThatThrownBy(() -> ManualInvoiceCalculator.calculate(request))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("Discount cannot exceed line subtotal");
	}

	@Test
	void rejectsEndDateBeforeStartDate() {
		ManualInvoiceRequest request = request(line("Widget", 1, "10.00", "0"));
		request.setStartDate(LocalDate.of(2026, 9, 22));
		request.setEndDate(LocalDate.of(2026, 9, 21));

		assertThatThrownBy(() -> ManualInvoiceCalculator.calculate(request))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("End date cannot be before start date");
	}

	private static ManualInvoiceRequest request(ManualInvoiceLineRequest... lines) {
		ManualInvoiceRequest request = new ManualInvoiceRequest();
		request.setTitle("Manual invoice");
		request.setStoreId(1L);
		request.setMarketplaceCode("TIKTOK");
		request.setStartDate(LocalDate.of(2026, 9, 1));
		request.setEndDate(LocalDate.of(2026, 9, 30));
		request.setVatRate(new BigDecimal("0.07"));
		request.setCurrency("thb");
		request.setLines(List.of(lines));
		return request;
	}

	private static ManualInvoiceLineRequest line(
			String productName,
			int quantity,
			String unitPrice,
			String discount) {
		ManualInvoiceLineRequest line = new ManualInvoiceLineRequest();
		line.setProductName(productName);
		line.setQuantity(quantity);
		line.setUnitPrice(new BigDecimal(unitPrice));
		line.setDiscount(new BigDecimal(discount));
		return line;
	}
}
