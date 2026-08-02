package com.laconic.lacoinvoice.features.order;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Order money helpers aligned with TikTok OrderSKUList Example formulas and
 * Thailand 7% VAT extraction from VAT-inclusive totals:
 * <ul>
 *   <li>SKU Subtotal Before Discount = Unit Original Price × Quantity</li>
 *   <li>Shipping Fee After Discount = Original − Seller Disc − Platform Disc</li>
 *   <li>EX.VAT = Total ÷ 1.07, VAT = Total − EX.VAT (Total = Order Amount)</li>
 * </ul>
 */
public final class OrderMoneyCalculator {

	public static final int VAT_PERCENTAGE = 7;

	private static final BigDecimal ONE_PLUS_VAT = BigDecimal.ONE
			.add(BigDecimal.valueOf(VAT_PERCENTAGE).movePointLeft(2));

	private OrderMoneyCalculator() {
	}

	public record VatBreakdown(BigDecimal amountExVat, BigDecimal vatAmount) {
	}

	/**
	 * Extract EX.VAT and VAT from a VAT-inclusive total (e.g. Order Amount).
	 */
	public static VatBreakdown fromInclusiveTotal(BigDecimal totalInclusive) {
		if (totalInclusive == null) {
			return new VatBreakdown(null, null);
		}
		BigDecimal amountExVat = totalInclusive.divide(ONE_PLUS_VAT, 2, RoundingMode.HALF_UP);
		BigDecimal vatAmount = totalInclusive.subtract(amountExVat);
		return new VatBreakdown(amountExVat, vatAmount);
	}

	public static BigDecimal skuSubtotalBeforeDiscount(BigDecimal unitPrice, Integer quantity) {
		if (unitPrice == null || quantity == null) {
			return null;
		}
		return unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
	}

	/**
	 * Seller discount when Excel left it blank:
	 * before discount − platform discount − after discount.
	 */
	public static BigDecimal skuSellerDiscount(
			BigDecimal subtotalBeforeDiscount,
			BigDecimal platformDiscount,
			BigDecimal lineTotal) {
		if (subtotalBeforeDiscount == null && lineTotal == null) {
			return null;
		}
		return nullToZero(subtotalBeforeDiscount)
				.subtract(nullToZero(platformDiscount))
				.subtract(nullToZero(lineTotal))
				.max(BigDecimal.ZERO)
				.setScale(2, RoundingMode.HALF_UP);
	}

	public static BigDecimal shippingFeeAfterDiscount(
			BigDecimal original,
			BigDecimal sellerDisc,
			BigDecimal platformDisc) {
		return nullToZero(original)
				.subtract(nullToZero(sellerDisc))
				.subtract(nullToZero(platformDisc))
				.max(BigDecimal.ZERO)
				.setScale(2, RoundingMode.HALF_UP);
	}

	private static BigDecimal nullToZero(BigDecimal value) {
		return value != null ? value : BigDecimal.ZERO;
	}
}
