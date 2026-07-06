package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "invoices")
public class Invoice extends MasterEntity {

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_invoice_order", value = ConstraintMode.NO_CONSTRAINT))
	private Order order;

	@Column(name = "invoice_no", nullable = false, unique = true, length = 50)
	private String invoiceNo;

	@Column(precision = 18, scale = 2)
	private BigDecimal subtotal;

	@Column(name = "vat_amount", precision = 18, scale = 2)
	private BigDecimal vatAmount;

	@Column(name = "vat_percentage")
	private Integer vatPercentage;

	@Column(name = "grand_total", precision = 18, scale = 2)
	private BigDecimal grandTotal;

	@Column(name = "status", nullable = false)
	private InvoiceStatus status;

	@Column(name = "pdf_url", length = 500)
	private String pdfUrl;

	@Column(name = "issued_at")
	private Instant issuedAt;
}
