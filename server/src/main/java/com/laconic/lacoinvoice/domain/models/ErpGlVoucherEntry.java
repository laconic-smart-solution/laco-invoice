package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Local GL entry line. Account/department/currency labels are resolved from ERP by ID. */
@Getter
@Setter
@Entity
@Table(name = "erp_gl_voucher_entries")
public class ErpGlVoucherEntry extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "voucher_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private ErpGlVoucher voucher;

	@Column(name = "external_erp_account_code_id")
	private Long externalErpAccountCodeId;

	@Column(name = "debit", precision = 18, scale = 2)
	private BigDecimal debit = BigDecimal.ZERO;

	@Column(name = "credit", precision = 18, scale = 2)
	private BigDecimal credit = BigDecimal.ZERO;

	@Column(name = "invoice_no", length = 100)
	private String invoiceNo;

	@Column(name = "invoice_date")
	private LocalDate invoiceDate;

	@Column(name = "note", length = 500)
	private String note;

	@Column(name = "external_erp_vendor_id")
	private Long externalErpVendorId;

	/** ERP {@code HR_PSNL_DEPARTMENT.DEPARTMENT_ID}. */
	@Column(name = "external_erp_department_id")
	private Long externalErpDepartmentId;

	/** ERP {@code GM_CURRENCY.CURRENCY_ID}. */
	@Column(name = "external_erp_currency_id")
	private Long externalErpCurrencyId;

	@Column(name = "exchange_rate", precision = 18, scale = 6)
	private BigDecimal exchangeRate = BigDecimal.ONE;
}
