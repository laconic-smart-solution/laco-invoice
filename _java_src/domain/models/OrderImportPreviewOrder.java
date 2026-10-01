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
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
		name = "order_import_preview_orders",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_import_preview_batch_ext",
				columnNames = { "batch_id", "external_order_id" }))
public class OrderImportPreviewOrder extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "batch_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderImportBatch batch;

	@Column(name = "external_order_id", nullable = false, length = 100)
	private String externalOrderId;

	@Enumerated(EnumType.STRING)
	@Column(name = "match_status", nullable = false, length = 20)
	private OrderImportMatchStatus matchStatus;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "existing_order_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Order existingOrder;

	@Enumerated(EnumType.STRING)
	@Column(name = "resolve_action", length = 20)
	private OrderImportResolveAction resolveAction;

	@Column(name = "resolve_source", length = 20)
	private String resolveSource;

	@Column(name = "excel_item_count")
	private Integer excelItemCount;

	@Column(name = "existing_item_count")
	private Integer existingItemCount;

	@Column(name = "excel_total_amount", precision = 18, scale = 2)
	private BigDecimal excelTotalAmount;

	@Column(name = "existing_total_amount", precision = 18, scale = 2)
	private BigDecimal existingTotalAmount;

	@Lob
	@Column(name = "header_json", columnDefinition = "CLOB")
	private String headerJson;

	@Column(name = "warning_code", length = 40)
	private String warningCode;
}
