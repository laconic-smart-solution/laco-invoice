package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Money received from a customer, allocated across one or more orders. */
@Getter
@Setter
@Entity
@Table(name = "payment_vouchers")
public class PaymentVoucher extends StoreScopedEntity {

	@Column(name = "voucher_number", nullable = false, length = 100)
	private String voucherNumber;

	@Column(name = "voucher_date", nullable = false)
	private LocalDate voucherDate;

	@Column(name = "customer_name", length = 255)
	private String customerName;

	@Column(name = "customer_tax_id", length = 100)
	private String customerTaxId;

	/** Total money received from the customer. */
	@Column(name = "total_amount", precision = 18, scale = 2)
	private BigDecimal totalAmount = BigDecimal.ZERO;

	/** Sum of allocations to orders. */
	@Column(name = "allocated_amount", precision = 18, scale = 2)
	private BigDecimal allocatedAmount = BigDecimal.ZERO;

	/** Credit balance left over after allocations. */
	@Column(name = "unallocated_amount", precision = 18, scale = 2)
	private BigDecimal unallocatedAmount = BigDecimal.ZERO;

	@Enumerated(EnumType.STRING)
	@Column(name = "payment_method", nullable = false, length = 30)
	private VoucherPaymentMethod paymentMethod = VoucherPaymentMethod.BANK_TRANSFER;

	@Column(name = "bank_reference", length = 200)
	private String bankReference;

	@Column(name = "proof_file_url", length = 1000)
	private String proofFileUrl;

	@Lob
	@Column(name = "notes", columnDefinition = "CLOB")
	private String notes;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private VoucherStatus status = VoucherStatus.CONFIRMED;
}
