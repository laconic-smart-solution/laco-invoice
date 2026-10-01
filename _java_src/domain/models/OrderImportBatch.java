package com.laconic.lacoinvoice.domain.models;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "order_import_batches")
public class OrderImportBatch extends StoreScopedEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "marketplace_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Marketplace marketplace;

	@Column(name = "created_by_user_id")
	private Long createdByUserId;

	@Column(name = "original_filename", nullable = false, length = 500)
	private String originalFilename;

	@Column(name = "sheet_name", length = 200)
	private String sheetName;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private OrderImportBatchStatus status = OrderImportBatchStatus.PREVIEW;

	@Column(name = "total_orders")
	private Integer totalOrders;

	@Column(name = "new_count")
	private Integer newCount;

	@Column(name = "duplicate_count")
	private Integer duplicateCount;

	@Column(name = "row_count")
	private Integer rowCount;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "committed_at")
	private Instant committedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "committed_import_file_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderImportFile committedImportFile;
}
