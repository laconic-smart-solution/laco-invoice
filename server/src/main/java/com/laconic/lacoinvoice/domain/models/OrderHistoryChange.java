package com.laconic.lacoinvoice.domain.models;

import org.hibernate.annotations.Check;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * Append-only field change row belonging to one {@link OrderHistory} event.
 */
@Getter
@Setter
@Entity
@Table(
		name = "order_history_changes",
		uniqueConstraints = @UniqueConstraint(
				name = "ux_ohc_hist_field",
				columnNames = { "history_id", "field_name" }),
		indexes = {
			// Oracle identifier limit is 30 chars — keep index names short.
			@Index(name = "ix_ohc_history", columnList = "history_id")
		})
@Check(
		name = "ck_ohc_value_type",
		constraints = "value_type IN ('STRING','INTEGER','DECIMAL','BOOLEAN','DATE','DATETIME','ENUM','JSON','TEXT')")
public class OrderHistoryChange {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "history_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderHistory history;

	@Column(name = "field_name", nullable = false, length = 100)
	private String fieldName;

	@Column(name = "field_label_key", length = 150)
	private String fieldLabelKey;

	@Column(name = "old_value", length = 2000)
	private String oldValue;

	@Column(name = "new_value", length = 2000)
	private String newValue;

	@Enumerated(EnumType.STRING)
	@Column(name = "value_type", nullable = false, length = 20)
	private OrderHistoryValueType valueType = OrderHistoryValueType.STRING;
}
