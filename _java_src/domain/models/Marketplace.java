package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "marketplaces")
public class Marketplace extends MasterEntity {

	@Column(nullable = false, unique = true, length = 50)
	private String code;

	@Column(nullable = false, length = 100)
	private String name;
}
