package com.laconic.lacoinvoice.common.persistence;

import java.time.Instant;

import org.hibernate.annotations.SQLRestriction;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

@Getter
@SQLRestriction("is_enable = 1")
@MappedSuperclass
public abstract class MasterEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Setter
	@Column(name = "created_by")
	private Long createdBy;

	@Setter
	@Column(name = "updated_by")
	private Long updatedBy;

	@JsonIgnore
	@Column(name = "is_enable", nullable = false)
	private boolean isEnable = true;

	@PrePersist
	protected void onCreate() {
		Instant now = Instant.now();
		this.createdAt = now;
		this.updatedAt = now;
		AuditUserContext.getCurrentLocalUserId().ifPresent(userId -> {
			if (this.createdBy == null) {
				this.createdBy = userId;
			}
			this.updatedBy = userId;
		});
	}

	@PreUpdate
	protected void onUpdate() {
		this.updatedAt = Instant.now();
		AuditUserContext.getCurrentLocalUserId().ifPresent(userId -> this.updatedBy = userId);
	}

	public void delete() {
		this.isEnable = false;
		onUpdate();
	}

	public void setEnable(boolean isEnable) {
		this.isEnable = isEnable;
	}

	public void setId(Long id) {
		this.id = id;
	}
}
