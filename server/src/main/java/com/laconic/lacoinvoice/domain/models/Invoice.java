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
@Table(name = "invoices")
public class Invoice extends StoreScopedEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "marketplace_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Marketplace marketplace;

	/** Optional order data input set this invoice was generated from. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_input_run_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderInputRun orderInputRun;

	@Column(name = "invoice_number", nullable = false, length = 100)
	private String invoiceNumber;

	@Column(name = "title", nullable = false, length = 200)
	private String title;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private InvoiceStatus status = InvoiceStatus.ISSUED;

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	@Column(name = "end_date", nullable = false)
	private LocalDate endDate;

	@Column(name = "order_count", nullable = false)
	private int orderCount;

	@Column(name = "item_count", nullable = false)
	private int itemCount;

	/** Total excluding VAT. */
	@Column(name = "subtotal", precision = 18, scale = 2)
	private BigDecimal subtotal = BigDecimal.ZERO;

	@Column(name = "vat_rate", precision = 6, scale = 4)
	private BigDecimal vatRate = new BigDecimal("0.0700");

	@Column(name = "vat_amount", precision = 18, scale = 2)
	private BigDecimal vatAmount = BigDecimal.ZERO;

	/** VAT-inclusive total billed to the buyer. */
	@Column(name = "grand_total", precision = 18, scale = 2)
	private BigDecimal grandTotal = BigDecimal.ZERO;

	@Column(name = "currency", length = 3)
	private String currency = "THB";

	@Lob
	@Column(name = "notes", columnDefinition = "CLOB")
	private String notes;

	@Column(name = "buyer_name", length = 255)
	private String buyerName;

	@Column(name = "buyer_tax_id", length = 100)
	private String buyerTaxId;

	@Lob
	@Column(name = "buyer_address", columnDefinition = "CLOB")
	private String buyerAddress;

	@Column(name = "issued_at")
	private Instant issuedAt;

	@Column(name = "paid_at")
	private Instant paidAt;
}
