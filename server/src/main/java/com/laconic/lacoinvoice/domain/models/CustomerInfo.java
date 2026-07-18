package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "customers_info")
public class CustomerInfo extends StoreScopedEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "marketplace_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Marketplace marketplace;

	@Column(name = "external_customer_id", length = 64)
	private String externalCustomerId;

	@Column(length = 255)
	private String name;

	@Column(length = 255)
	private String email;

	@Column(length = 100)
	private String phone;

	@Column(length = 7)
	private String gender;

	@Lob
	@Column(columnDefinition = "CLOB")
	private String address;
}
