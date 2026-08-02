package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "order_import_files")
public class OrderImportFile extends StoreScopedEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "marketplace_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Marketplace marketplace;

	@Column(name = "original_filename", nullable = false, length = 500)
	private String originalFilename;

	@Column(name = "sheet_name", length = 200)
	private String sheetName;

	@Column(name = "row_count")
	private Integer rowCount;

	@Column(name = "imported_orders")
	private Integer importedOrders;

	@Column(name = "imported_items")
	private Integer importedItems;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private OrderImportStatus status = OrderImportStatus.COMPLETED;
}
