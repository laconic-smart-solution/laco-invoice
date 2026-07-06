package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
}
