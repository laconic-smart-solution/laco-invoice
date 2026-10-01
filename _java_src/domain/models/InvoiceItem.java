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

/** Snapshot of one order line item as billed on an invoice. */
@Getter
@Setter
@Entity
@Table(name = "invoice_items")
public class InvoiceItem extends MasterEntity {

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

	@Column(name = "platform_sku_id", length = 400)
	private String platformSkuId;

	@Column(name = "seller_sku", length = 100)
	private String sellerSku;

	@Column(name = "product_name", length = 255)
	private String productName;

	@Column(name = "variation", length = 400)
	private String variation;

	@Column(name = "quantity")
	private Integer quantity;

	@Column(name = "unit_price", precision = 18, scale = 2)
	private BigDecimal unitPrice = BigDecimal.ZERO;

	/** Line amount before discounts. */
	@Column(name = "subtotal", precision = 18, scale = 2)
	private BigDecimal subtotal = BigDecimal.ZERO;

	@Column(name = "discount", precision = 18, scale = 2)
	private BigDecimal discount = BigDecimal.ZERO;

	@Column(name = "total_amount", precision = 18, scale = 2)
	private BigDecimal totalAmount = BigDecimal.ZERO;
}
