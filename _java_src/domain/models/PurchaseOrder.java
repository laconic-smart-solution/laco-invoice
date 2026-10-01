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
@Table(name = "purchase_orders")
public class PurchaseOrder extends MasterEntity {

	@Column(name = "po_number", length = 50)
	private String poNumber;

	@Column(name = "status", nullable = false)
	private PurchaseOrderStatus status;
}
