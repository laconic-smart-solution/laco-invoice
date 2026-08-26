package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "products")
public class Product extends StoreScopedEntity {

	@Column(length = 100)
	private String sku;

	@Column(length = 255)
	private String name;

	@Column(precision = 18, scale = 2)
	private BigDecimal price;

	@Column(name = "marketplace_code", length = 20)
	private String marketplaceCode;

	@Column(name = "external_product_id", length = 64)
	private String externalProductId;

	@Column(length = 3)
	private String currency;

	@Column(length = 50)
	private String status;

	@Lob
	@Column(columnDefinition = "CLOB")
	private String description;

	@Lob
	@Column(name = "images_json", columnDefinition = "CLOB")
	private String imagesJson;

	@Lob
	@Column(name = "variants_json", columnDefinition = "CLOB")
	private String variantsJson;

	@Column(name = "last_synced_at")
	private Instant lastSyncedAt;

	@Column(name = "last_sync_run_id")
	private Long lastSyncRunId;
}
