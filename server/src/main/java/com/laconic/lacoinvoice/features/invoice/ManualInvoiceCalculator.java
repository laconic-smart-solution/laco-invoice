package com.laconic.lacoinvoice.features.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.features.invoice.dto.ManualInvoiceLineDto;
import com.laconic.lacoinvoice.features.invoice.dto.ManualInvoiceLineRequest;
import com.laconic.lacoinvoice.features.invoice.dto.ManualInvoicePreviewDto;
import com.laconic.lacoinvoice.features.invoice.dto.ManualInvoiceRequest;

final class ManualInvoiceCalculator {

	private ManualInvoiceCalculator() {
	}

	static ManualInvoicePreviewDto calculate(ManualInvoiceRequest request) {
		if (request.getEndDate().isBefore(request.getStartDate())) {
			throw new IllegalArgumentException("End date cannot be before start date.");
		}
		List<ManualInvoiceLineDto> lines = request.getLines().stream()
				.map(ManualInvoiceCalculator::calculateLine)
				.toList();
		BigDecimal subtotal = money(lines.stream()
				.map(ManualInvoiceLineDto::totalAmount)
				.reduce(BigDecimal.ZERO, BigDecimal::add));
		BigDecimal vatRate = request.getVatRate().setScale(4, RoundingMode.HALF_UP);
		BigDecimal vatAmount = money(subtotal.multiply(vatRate));
		BigDecimal grandTotal = money(subtotal.add(vatAmount));
		int itemCount = lines.stream().mapToInt(ManualInvoiceLineDto::quantity).sum();
		return new ManualInvoicePreviewDto(
				itemCount,
				subtotal,
				vatRate,
				vatAmount,
				grandTotal,
				request.getCurrency().trim().toUpperCase(),
				lines);
	}

	private static ManualInvoiceLineDto calculateLine(ManualInvoiceLineRequest line) {
		BigDecimal unitPrice = money(line.getUnitPrice());
		BigDecimal discount = money(nonNull(line.getDiscount()));
		BigDecimal subtotal = money(unitPrice.multiply(BigDecimal.valueOf(line.getQuantity())));
		if (discount.compareTo(subtotal) > 0) {
			throw new IllegalArgumentException(
					"Discount cannot exceed line subtotal for product \"" + line.getProductName() + "\".");
		}
		return new ManualInvoiceLineDto(
				line.getProductName().trim(),
				trimToNull(line.getDescription()),
				trimToNull(line.getSku()),
				line.getQuantity(),
				unitPrice,
				discount,
				subtotal,
				money(subtotal.subtract(discount)));
	}

	private static BigDecimal nonNull(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static BigDecimal money(BigDecimal value) {
		return nonNull(value).setScale(2, RoundingMode.HALF_UP);
	}

	private static String trimToNull(String value) {
		return StringUtils.hasText(value) ? value.trim() : null;
	}
}
