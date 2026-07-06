package com.laconic.lacoinvoice.domain.models;

import java.time.Instant;

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
@Table(name = "store_marketplace_connections")
public class StoreMarketplaceConnection extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "store_id", nullable = false, foreignKey = @ForeignKey(name = "fk_smc_store", value = ConstraintMode.NO_CONSTRAINT))
	private Store store;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "marketplace_id", nullable = false, foreignKey = @ForeignKey(name = "fk_smc_marketplace", value = ConstraintMode.NO_CONSTRAINT))
	private Marketplace marketplace;

	@Column(name = "access_token", columnDefinition = "CLOB")
	private String accessToken;

	@Column(name = "refresh_token", columnDefinition = "CLOB")
	private String refreshToken;

	@Column(name = "token_expiry")
	private Instant tokenExpiry;

	@Column(name = "status", nullable = false)
	private MarketplaceConnectionStatus status;
}
