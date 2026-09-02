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
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Portion of a {@link PaymentVoucher} applied to a single order. */
@Getter
@Setter
@Entity
@Table(name = "voucher_order_allocations")
public class VoucherOrderAllocation extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "voucher_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private PaymentVoucher voucher;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Order order;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "invoice_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Invoice invoice;

	@Column(name = "external_order_id", length = 100)
	private String externalOrderId;

	@Column(name = "invoice_number", length = 100)
	private String invoiceNumber;

	@Column(name = "order_total_amount", precision = 18, scale = 2)
	private BigDecimal orderTotalAmount = BigDecimal.ZERO;

	@Column(name = "allocated_amount", precision = 18, scale = 2)
	private BigDecimal allocatedAmount = BigDecimal.ZERO;

	/** Amount already paid on this order before this voucher was recorded. */
	@Column(name = "previous_paid_amount", precision = 18, scale = 2)
	private BigDecimal previousPaidAmount = BigDecimal.ZERO;

	@Column(name = "remaining_balance", precision = 18, scale = 2)
	private BigDecimal remainingBalance = BigDecimal.ZERO;

	@Column(name = "buyer_name", length = 255)
	private String buyerName;

	@Column(name = "allocated_at")
	private Instant allocatedAt;

	@Lob
	@Column(name = "notes", columnDefinition = "CLOB")
	private String notes;
}
