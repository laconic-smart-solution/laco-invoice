package com.laconic.lacoinvoice.features.order.inputrun;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.domain.models.InvoicePdfMatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputFileType;
import com.laconic.lacoinvoice.domain.models.OrderInputRun;
import com.laconic.lacoinvoice.features.order.import_.OrderSkuListExcelParser;
import com.laconic.lacoinvoice.features.order.import_.OrderSkuListExcelRow;
import com.laconic.lacoinvoice.features.order.import_.ParsedOrderSkuListWorkbook;
import com.laconic.lacoinvoice.features.order.inputrun.ParsedWithdrawWorkbook.ParsedWithdrawRow;

@Component
public class InvoicePdfExcelMatcher {

	private static final BigDecimal MATCH_TOLERANCE = new BigDecimal("0.05");

	private final OrderSkuListExcelParser orderSkuListExcelParser;
	private final OrderWithdrawExcelParser withdrawExcelParser;

	public InvoicePdfExcelMatcher(
			OrderSkuListExcelParser orderSkuListExcelParser,
			OrderWithdrawExcelParser withdrawExcelParser) {
		this.orderSkuListExcelParser = orderSkuListExcelParser;
		this.withdrawExcelParser = withdrawExcelParser;
	}

	public MatchResult match(OrderInputRun run) {
		if (run.getInvoicePdfContent() == null || run.getInvoicePdfContent().length == 0) {
			return MatchResult.missing();
		}
		if (run.getInvoiceTotalAmount() == null) {
			return new MatchResult(InvoicePdfMatchStatus.UNPARSED, null, null,
					"Could not read a total amount from the invoice PDF.");
		}

		byte[] excel = excelBytes(run);
		if (excel == null || excel.length == 0) {
			return MatchResult.missing();
		}

		BigDecimal excelAmount = sumExcelAmount(run, excel);
		if (excelAmount == null) {
			return new MatchResult(InvoicePdfMatchStatus.UNPARSED, null, null,
					"Could not sum a shipping/logistics amount from the Excel file.");
		}

		BigDecimal difference = excelAmount.subtract(run.getInvoiceTotalAmount()).abs();
		boolean matched = difference.compareTo(MATCH_TOLERANCE) <= 0;
		return new MatchResult(
				matched ? InvoicePdfMatchStatus.MATCHED : InvoicePdfMatchStatus.MISMATCH,
				excelAmount,
				difference,
				matched
						? "Excel shipping/logistics total matches the invoice PDF amount."
						: "Excel total " + excelAmount + " does not match invoice PDF amount "
								+ run.getInvoiceTotalAmount() + ".");
	}

	private BigDecimal sumExcelAmount(OrderInputRun run, byte[] excel) {
		OrderInputFileType type = run.getInputFileType() == OrderInputFileType.SERVICE_FEE
				? OrderInputFileType.SERVICE_FEE
				: OrderInputFileType.SHIPPING_FEE;
		try {
			if (type == OrderInputFileType.SERVICE_FEE) {
				return sumWithdrawShipping(excel);
			}
			return sumOrderSkuShipping(excel);
		} catch (RuntimeException ex) {
			return null;
		}
	}

	private BigDecimal sumOrderSkuShipping(byte[] excel) {
		ParsedOrderSkuListWorkbook parsed =
				orderSkuListExcelParser.parse(new ByteArrayInputStream(excel));
		BigDecimal total = BigDecimal.ZERO;
		for (OrderSkuListExcelRow order : parsed.ordersByExternalId().values()) {
			BigDecimal amount = order.getShippingFeeAfterDiscount();
			if (amount == null) {
				amount = order.getShippingFeeOriginal();
			}
			if (amount != null) {
				total = total.add(amount);
			}
		}
		return total.setScale(2, RoundingMode.HALF_UP);
	}

	private BigDecimal sumWithdrawShipping(byte[] excel) {
		ParsedWithdrawWorkbook parsed = withdrawExcelParser.parse(excel);
		BigDecimal actual = BigDecimal.ZERO;
		boolean hasActual = false;
		BigDecimal seller = BigDecimal.ZERO;
		boolean hasSeller = false;
		for (ParsedWithdrawRow row : parsed.rows()) {
			if (row.actualShippingFee() != null) {
				actual = actual.add(row.actualShippingFee());
				hasActual = true;
			}
			if (row.sellerShippingFee() != null) {
				seller = seller.add(row.sellerShippingFee());
				hasSeller = true;
			}
		}
		if (hasActual) {
			return actual.abs().setScale(2, RoundingMode.HALF_UP);
		}
		if (hasSeller) {
			return seller.abs().setScale(2, RoundingMode.HALF_UP);
		}
		return null;
	}

	private static byte[] excelBytes(OrderInputRun run) {
		if (run.getInputFileType() == OrderInputFileType.SERVICE_FEE) {
			return run.getWithdrawContent();
		}
		return run.getOrderDetailContent();
	}

	public record MatchResult(
			InvoicePdfMatchStatus status,
			BigDecimal excelAmount,
			BigDecimal difference,
			String message) {

		static MatchResult missing() {
			return new MatchResult(InvoicePdfMatchStatus.MISSING, null, null, null);
		}
	}
}
