package com.laconic.lacoinvoice.domain.models;

import java.time.Instant;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "marketplace_product_sync_runs")
public class MarketplaceProductSyncRun extends MasterEntity {

	@Column(name = "store_id", nullable = false)
	private Long storeId;

	@Column(name = "marketplace_code", nullable = false, length = 20)
	private String marketplaceCode;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private MarketplaceProductSyncStatus status = MarketplaceProductSyncStatus.RUNNING;

	@Column(name = "inserted_count", nullable = false)
	private int insertedCount;

	@Column(name = "updated_count", nullable = false)
	private int updatedCount;

	@Column(name = "disabled_count", nullable = false)
	private int disabledCount;

	@Column(name = "failed_count", nullable = false)
	private int failedCount;

	@Lob
	@Column(name = "error_message", columnDefinition = "CLOB")
	private String errorMessage;

	@Column(name = "started_at", nullable = false)
	private Instant startedAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	@Column(name = "triggered_by")
	private Long triggeredBy;
}
