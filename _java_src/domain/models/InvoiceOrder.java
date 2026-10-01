package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Snapshot of one order as billed on an invoice. */
@Getter
@Setter
@Entity
@Table(name = "invoice_orders")
public class InvoiceOrder extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "invoice_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Invoice invoice;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Order order;

	@Column(name = "external_order_id", length = 100)
	private String externalOrderId;

	@Column(name = "order_date")
	private LocalDate orderDate;

	@Column(name = "item_count", nullable = false)
	private int itemCount;

	@Column(name = "total_amount", precision = 18, scale = 2)
	private BigDecimal totalAmount = BigDecimal.ZERO;

	@Column(name = "vat_amount", precision = 18, scale = 2)
	private BigDecimal vatAmount = BigDecimal.ZERO;

	@Column(name = "amount_ex_vat", precision = 18, scale = 2)
	private BigDecimal amountExVat = BigDecimal.ZERO;

	@Column(name = "buyer_name", length = 255)
	private String buyerName;

	@Column(name = "buyer_tax_id", length = 100)
	private String buyerTaxId;
}
