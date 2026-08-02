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
@Table(name = "order_bulk_generate_runs")
public class OrderBulkGenerateRun extends MasterEntity {

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private OrderBulkGenerateStatus status = OrderBulkGenerateStatus.RUNNING;

	@Column(name = "total_count", nullable = false)
	private int totalCount;

	@Column(name = "processed_count", nullable = false)
	private int processedCount;

	@Column(name = "success_count", nullable = false)
	private int successCount;

	@Column(name = "failed_count", nullable = false)
	private int failedCount;

	@Lob
	@Column(name = "order_ids_json", columnDefinition = "CLOB", nullable = false)
	private String orderIdsJson;

	@Column(name = "work_dir", length = 500)
	private String workDir;

	@Column(name = "zip_path", length = 500)
	private String zipPath;

	@Column(name = "zip_filename", length = 255)
	private String zipFilename;

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
