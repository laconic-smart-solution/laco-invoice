package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;

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

@Getter
@Setter
@Entity
@Table(name = "order_import_preview_items")
public class OrderImportPreviewItem extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "preview_order_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderImportPreviewOrder previewOrder;

	@Column(name = "platform_sku_id", length = 400)
	private String platformSkuId;

	@Column(length = 100)
	private String sku;

	@Column(name = "product_name", length = 500)
	private String productName;

	@Column(length = 400)
	private String variation;

	private Integer quantity;

	@Column(name = "quantity_returned")
	private Integer quantityReturned;

	@Column(name = "unit_price", precision = 18, scale = 2)
	private BigDecimal unitPrice;

	@Column(name = "subtotal_before_discount", precision = 18, scale = 2)
	private BigDecimal subtotalBeforeDiscount;

	@Column(name = "platform_discount", precision = 18, scale = 2)
	private BigDecimal platformDiscount;

	@Column(name = "seller_discount", precision = 18, scale = 2)
	private BigDecimal sellerDiscount;

	@Column(name = "line_total", precision = 18, scale = 2)
	private BigDecimal lineTotal;

	@Column(name = "weight_kg", precision = 18, scale = 4)
	private BigDecimal weightKg;

	@Column(name = "product_category", length = 255)
	private String productCategory;

	@Column(name = "merge_hint", length = 40)
	private String mergeHint;

	/** 1-based Excel sheet row number for display (No.). */
	@Column(name = "excel_row_index")
	private Integer excelRowIndex;

	/** Full Excel row as JSON object of column header → cell text. */
	@Lob
	@Column(name = "excel_row_json")
	private String excelRowJson;
}
