package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "erp_items")
public class ErpItem extends MasterEntity {

	@Column(name = "erp_code", length = 100)
	private String erpCode;

	@Column(length = 255)
	private String name;

	@Lob
	@Column(columnDefinition = "CLOB")
	private String description;
}
