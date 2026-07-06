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
@Table(name = "purchase_order_items")
public class PurchaseOrderItem extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "po_id", nullable = false, foreignKey = @ForeignKey(name = "fk_poi_po", value = ConstraintMode.NO_CONSTRAINT))
	private PurchaseOrder purchaseOrder;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "erp_item_id", nullable = false, foreignKey = @ForeignKey(name = "fk_poi_erp_item", value = ConstraintMode.NO_CONSTRAINT))
	private ErpItem erpItem;

	private Integer quantity;

	@Column(name = "unit_price", precision = 18, scale = 2)
	private BigDecimal unitPrice;
}
