package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "order_items")
public class OrderItem extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_item_order", value = ConstraintMode.NO_CONSTRAINT))
	private Order order;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_item_product", value = ConstraintMode.NO_CONSTRAINT))
	private Product product;

	@Column(name = "platform_sku_id", length = 400)
	private String platformSkuId;

	@Column(length = 100)
	private String sku;

	@Column(name = "product_name", length = 255)
	private String productName;

	@Column(length = 400)
	private String variation;

	@Column(precision = 18, scale = 2)
	private BigDecimal price;

	private Integer quantity;

	@Column(name = "quantity_returned")
	private Integer quantityReturned;

	@Column(name = "subtotal_before_discount", precision = 18, scale = 2)
	private BigDecimal subtotalBeforeDiscount;

	@Column(name = "item_platform_discount", precision = 18, scale = 2)
	private BigDecimal itemPlatformDiscount;

	@Column(name = "item_seller_discount", precision = 18, scale = 2)
	private BigDecimal itemSellerDiscount;

	@Column(name = "line_total", precision = 18, scale = 2)
	private BigDecimal lineTotal;

	@Column(name = "product_category", length = 200)
	private String productCategory;

	@Column(name = "weight_kg", precision = 10, scale = 3)
	private BigDecimal weightKg;

	@Enumerated(EnumType.STRING)
	@Column(name = "source_type", length = 20)
	private OrderSourceType sourceType = OrderSourceType.API;

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
