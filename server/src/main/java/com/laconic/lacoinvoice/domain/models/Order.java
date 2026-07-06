package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

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

@Getter
@Setter
@Entity
@Table(name = "lco_orders")
public class Order extends StoreScopedEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "marketplace_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Marketplace marketplace;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "customer_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private CustomerInfo customer;

	@Column(name = "external_order_id", length = 100)
	private String externalOrderId;

	@Lob
	@Column(name = "external_order_detail_json", columnDefinition = "CLOB")
	private String externalOrderDetailJson;

	@Column(name = "order_status", nullable = false)
	private OrderStatus orderStatus = OrderStatus.PENDING;

	@Column(precision = 18, scale = 2)
	private BigDecimal subtotal;

	@Column(name = "shipping_fee", precision = 18, scale = 2)
	private BigDecimal shippingFee;

	@Column(name = "total_amount", precision = 18, scale = 2)
	private BigDecimal totalAmount;

	@Column(name = "order_date")
	private Instant orderDate;
}
