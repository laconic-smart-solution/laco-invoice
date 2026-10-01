package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "order_input_runs")
public class OrderInputRun extends StoreScopedEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "marketplace_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Marketplace marketplace;

	@Column(name = "title", nullable = false, length = 200)
	private String title;

	@Enumerated(EnumType.STRING)
	@Column(name = "input_file_type", length = 20)
	private OrderInputFileType inputFileType = OrderInputFileType.SHIPPING_FEE;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private OrderInputRunStatus status = OrderInputRunStatus.DRAFT;

	@Column(name = "order_detail_filename", length = 500)
	private String orderDetailFilename;

	@Lob
	@Column(name = "order_detail_content")
	private byte[] orderDetailContent;

	@Column(name = "order_detail_size")
	private Long orderDetailSize;

	@Enumerated(EnumType.STRING)
	@Column(name = "order_detail_status", nullable = false, length = 20)
	private OrderInputFileStatus orderDetailStatus = OrderInputFileStatus.MISSING;

	@Lob
	@Column(name = "order_detail_error")
	private String orderDetailError;

	@Column(name = "order_detail_started_at")
	private Instant orderDetailStartedAt;

	@Column(name = "order_detail_finished_at")
	private Instant orderDetailFinishedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_detail_batch_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderImportBatch orderDetailBatch;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_detail_import_file_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderImportFile orderDetailImportFile;

	@Column(name = "withdraw_filename", length = 500)
	private String withdrawFilename;

	@Lob
	@Column(name = "withdraw_content")
	private byte[] withdrawContent;

	@Column(name = "withdraw_size")
	private Long withdrawSize;

	@Enumerated(EnumType.STRING)
	@Column(name = "withdraw_status", nullable = false, length = 20)
	private OrderInputFileStatus withdrawStatus = OrderInputFileStatus.MISSING;

	@Lob
	@Column(name = "withdraw_error")
	private String withdrawError;

	@Column(name = "withdraw_started_at")
	private Instant withdrawStartedAt;

	@Column(name = "withdraw_finished_at")
	private Instant withdrawFinishedAt;

	@Column(name = "withdraw_row_count")
	private Integer withdrawRowCount;

	@Column(name = "withdraw_matched_count")
	private Integer withdrawMatchedCount;

	@Column(name = "withdraw_unmatched_count")
	private Integer withdrawUnmatchedCount;

	@Column(name = "invoice_pdf_filename", length = 500)
	private String invoicePdfFilename;

	@Lob
	@Column(name = "invoice_pdf_content")
	private byte[] invoicePdfContent;

	@Column(name = "invoice_pdf_size")
	private Long invoicePdfSize;

	@Enumerated(EnumType.STRING)
	@Column(name = "invoice_pdf_status", length = 20)
	private OrderInputFileStatus invoicePdfStatus = OrderInputFileStatus.MISSING;

	@Lob
	@Column(name = "invoice_pdf_error")
	private String invoicePdfError;

	@Column(name = "invoice_receipt_number", length = 100)
	private String invoiceReceiptNumber;

	@Column(name = "invoice_receipt_date")
	private LocalDate invoiceReceiptDate;

	@Column(name = "invoice_period_start")
	private LocalDate invoicePeriodStart;

	@Column(name = "invoice_period_end")
	private LocalDate invoicePeriodEnd;

	@Column(name = "invoice_issuer_name", length = 255)
	private String invoiceIssuerName;

	@Column(name = "invoice_issuer_tax_id", length = 50)
	private String invoiceIssuerTaxId;

	@Column(name = "invoice_buyer_name", length = 255)
	private String invoiceBuyerName;

	@Column(name = "invoice_buyer_tax_id", length = 50)
	private String invoiceBuyerTaxId;

	@Column(name = "invoice_total_amount", precision = 18, scale = 2)
	private BigDecimal invoiceTotalAmount;

	@Column(name = "invoice_wht_amount", precision = 18, scale = 2)
	private BigDecimal invoiceWithholdingTaxAmount;

	@Column(name = "invoice_wht_rate", precision = 8, scale = 4)
	private BigDecimal invoiceWithholdingTaxRate;

	@Column(name = "excel_matched_amount", precision = 18, scale = 2)
	private BigDecimal excelMatchedAmount;

	@Enumerated(EnumType.STRING)
	@Column(name = "invoice_match_status", length = 20)
	private InvoicePdfMatchStatus invoiceMatchStatus = InvoicePdfMatchStatus.MISSING;

	@Column(name = "invoice_match_difference", precision = 18, scale = 2)
	private BigDecimal invoiceMatchDifference;
}
