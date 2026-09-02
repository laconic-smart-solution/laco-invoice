package com.laconic.lacoinvoice.features.order.inputrun;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.laconic.lacoinvoice.domain.models.InvoicePdfMatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputFileStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputFileType;
import com.laconic.lacoinvoice.domain.models.OrderInputRunStatus;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LacoinvoiceOrderInputRunDto")
public record OrderInputRunDto(
		Long id,
		Long storeId,
		String storeName,
		Long marketplaceId,
		String marketplaceCode,
		String title,
		OrderInputFileType inputFileType,
		OrderInputRunStatus status,
		String orderDetailFilename,
		Long orderDetailSize,
		OrderInputFileStatus orderDetailStatus,
		String orderDetailError,
		Instant orderDetailStartedAt,
		Instant orderDetailFinishedAt,
		Long orderDetailBatchId,
		Long orderDetailImportFileId,
		String withdrawFilename,
		Long withdrawSize,
		OrderInputFileStatus withdrawStatus,
		String withdrawError,
		Instant withdrawStartedAt,
		Instant withdrawFinishedAt,
		Integer withdrawRowCount,
		Integer withdrawMatchedCount,
		Integer withdrawUnmatchedCount,
		String invoicePdfFilename,
		Long invoicePdfSize,
		OrderInputFileStatus invoicePdfStatus,
		String invoicePdfError,
		String invoiceReceiptNumber,
		LocalDate invoiceReceiptDate,
		LocalDate invoicePeriodStart,
		LocalDate invoicePeriodEnd,
		String invoiceIssuerName,
		String invoiceIssuerTaxId,
		String invoiceBuyerName,
		String invoiceBuyerTaxId,
		BigDecimal invoiceTotalAmount,
		BigDecimal invoiceWithholdingTaxAmount,
		BigDecimal invoiceWithholdingTaxRate,
		BigDecimal excelMatchedAmount,
		InvoicePdfMatchStatus invoiceMatchStatus,
		BigDecimal invoiceMatchDifference,
		Integer orderCount,
		Integer itemCount,
		Instant createdAt,
		Instant updatedAt) {
}
