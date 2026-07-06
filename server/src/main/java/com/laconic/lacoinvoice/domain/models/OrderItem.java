package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;

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

	@Column(length = 100)
	private String sku;

	@Column(name = "product_name", length = 255)
	private String productName;

	@Column(precision = 18, scale = 2)
	private BigDecimal price;

	private Integer quantity;

	@Column(name = "line_total", precision = 18, scale = 2)
	private BigDecimal lineTotal;
}
