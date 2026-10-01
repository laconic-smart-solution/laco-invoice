package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.Instant;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
		name = "lco_orders",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_lco_orders_store_mp_ext",
				columnNames = { "store_id", "marketplace_id", "external_order_id" }))
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

	@Column(name = "order_substatus", length = 100)
	private String orderSubstatus;

	@Column(name = "cancel_return_type", length = 100)
	private String cancelReturnType;

	@Column(name = "order_kind", length = 100)
	private String orderKind;

	@Column(precision = 18, scale = 2)
	private BigDecimal subtotal;

	@Column(name = "shipping_fee", precision = 18, scale = 2)
	private BigDecimal shippingFee;

	@Column(name = "shipping_fee_original", precision = 18, scale = 2)
	private BigDecimal shippingFeeOriginal;

	@Column(name = "shipping_fee_seller_disc", precision = 18, scale = 2)
	private BigDecimal shippingFeeSellerDisc;

	@Column(name = "shipping_fee_platform_disc", precision = 18, scale = 2)
	private BigDecimal shippingFeePlatformDisc;

	@Column(name = "payment_platform_discount", precision = 18, scale = 2)
	private BigDecimal paymentPlatformDiscount;

	@Column(precision = 18, scale = 2)
	private BigDecimal taxes;

	/** Amount excluding VAT, derived from VAT-inclusive {@link #totalAmount} (7%). */
	@Column(name = "amount_ex_vat", precision = 18, scale = 2)
	private BigDecimal amountExVat;

	/** VAT portion of {@link #totalAmount} (Thailand 7%). */
	@Column(name = "vat_amount", precision = 18, scale = 2)
	private BigDecimal vatAmount;

	@Column(name = "total_amount", precision = 18, scale = 2)
	private BigDecimal totalAmount;

	@Column(name = "refund_amount", precision = 18, scale = 2)
	private BigDecimal refundAmount;

	@Column(length = 3)
	private String currency;

	@Column(name = "order_date")
	private Instant orderDate;

	@Column(name = "paid_at")
	private Instant paidAt;

	@Column(name = "rts_at")
	private Instant rtsAt;

	@Column(name = "shipped_at")
	private Instant shippedAt;

	@Column(name = "delivered_at")
	private Instant deliveredAt;

	@Column(name = "cancelled_at")
	private Instant cancelledAt;

	@Column(name = "cancel_by", length = 100)
	private String cancelBy;

	@Column(name = "cancel_reason", length = 1020)
	private String cancelReason;

	@Column(name = "fulfillment_type", length = 100)
	private String fulfillmentType;

	@Column(name = "warehouse_name", length = 100)
	private String warehouseName;

	@Column(name = "tracking_id", length = 200)
	private String trackingId;

	@Column(name = "delivery_option", length = 200)
	private String deliveryOption;

	@Column(name = "shipping_provider_name", length = 200)
	private String shippingProviderName;

	@Column(name = "payment_method", length = 100)
	private String paymentMethod;

	@Column(name = "package_id", length = 200)
	private String packageId;

	@Column(name = "checked_status", length = 50)
	private String checkedStatus;

	@Column(name = "checked_marked_by", length = 200)
	private String checkedMarkedBy;

	@Lob
	@Column(name = "buyer_message", columnDefinition = "CLOB")
	private String buyerMessage;

	@Lob
	@Column(name = "seller_note", columnDefinition = "CLOB")
	private String sellerNote;

	@Enumerated(EnumType.STRING)
	@Column(name = "source_type", length = 20)
	private OrderSourceType sourceType = OrderSourceType.API;

	/** When {@link #sourceType} is IMPORT, references {@code order_import_files.id}. */
	@Column(name = "source_id")
	private Long sourceId;

	@PrePersist
	@PreUpdate
	void ensureSourceDefaults() {
		if (sourceType == null) {
			sourceType = OrderSourceType.API;
		}
	}
}
