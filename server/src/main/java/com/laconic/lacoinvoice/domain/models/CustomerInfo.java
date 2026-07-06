package com.laconic.lacoinvoice.domain.models;

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
@Table(name = "customers_info")
public class CustomerInfo extends StoreScopedEntity {

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
