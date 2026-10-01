package com.laconic.lacoinvoice.domain.models;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "order_tax_invoices")
public class OrderTaxInvoice extends MasterEntity {

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false, unique = true, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Order order;

	@Column(nullable = false)
	private boolean requested;

	@Column(name = "buyer_tax_id", length = 100)
	private String buyerTaxId;

	@Column(name = "tax_type", length = 50)
	private String taxType;

	@Column(name = "full_name", length = 1020)
	private String fullName;

	@Column(length = 1020)
	private String email;

	@Column(name = "phone_number", length = 400)
	private String phoneNumber;

	@Lob
	@Column(name = "registered_address", columnDefinition = "CLOB")
	private String registeredAddress;

	@Column(name = "address_type", length = 50)
	private String addressType;
}
