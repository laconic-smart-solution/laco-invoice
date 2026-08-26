package com.laconic.lacoinvoice.domain.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.Check;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Append-only audit event for an order. Do not update or soft-delete after insert.
 */
@Getter
@Setter
@Entity
@Table(
		name = "order_history",
		indexes = {
			// Oracle identifier limit is 30 chars — keep index names short.
			@Index(name = "ix_oh_order_perf", columnList = "order_id, performed_at, id"),
			@Index(name = "ix_oh_import_file", columnList = "import_file_id"),
			@Index(name = "ix_oh_user", columnList = "performed_by_user_id"),
			@Index(name = "ix_oh_source_perf", columnList = "source, performed_at"),
			@Index(name = "ix_oh_action_perf", columnList = "action, performed_at")
		})
@Check(name = "ck_oh_source", constraints = "source IN ('MANUAL','IMPORT_EXCEL')")
@Check(name = "ck_oh_action", constraints = "action IN ('CREATE','UPDATE','DELETE')")
@Check(
		name = "ck_oh_import_file",
		constraints = "(source = 'IMPORT_EXCEL' AND import_file_id IS NOT NULL) OR (source = 'MANUAL' AND import_file_id IS NULL)")
public class OrderHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Order order;

	@Enumerated(EnumType.STRING)
	@Column(name = "action", nullable = false, length = 20)
	private OrderHistoryAction action;

	@Enumerated(EnumType.STRING)
	@Column(name = "source", nullable = false, length = 20)
	private OrderHistorySource source;

	@Column(name = "performed_by_user_id")
	private Long performedByUserId;

	@Column(name = "performed_at", nullable = false)
	private Instant performedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "import_file_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderImportFile importFile;

	@Column(name = "note", length = 500)
	private String note;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@OneToMany(mappedBy = "history", cascade = CascadeType.PERSIST, orphanRemoval = false)
	private List<OrderHistoryChange> changes = new ArrayList<>();

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		if (performedAt == null) {
			performedAt = now;
		}
		if (createdAt == null) {
			createdAt = now;
		}
	}

	public void addChange(OrderHistoryChange change) {
		changes.add(change);
		change.setHistory(this);
	}
}
