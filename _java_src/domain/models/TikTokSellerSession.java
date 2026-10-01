package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Playwright storage_state for TikTok Shop scrape mode, keyed by seller/shop id.
 * Owned by laco-invoice DB (not the scrape sidecar SQLite).
 */
@Getter
@Setter
@Entity
@Table(name = "tiktok_seller_sessions")
public class TikTokSellerSession extends MasterEntity {

	@Column(name = "seller_id", nullable = false, unique = true, length = 128)
	private String sellerId;

	@Column(name = "display_name", length = 255)
	private String displayName;

	@Lob
	@Column(name = "storage_state_json", nullable = false, columnDefinition = "CLOB")
	private String storageStateJson;
}
