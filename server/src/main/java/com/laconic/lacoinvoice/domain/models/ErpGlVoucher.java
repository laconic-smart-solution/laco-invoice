package com.laconic.lacoinvoice.domain.models;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.laconic.lacoinvoice.common.store.StoreScopedEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Local GL voucher record. ERP masters (item, account, vendor) are referenced by
 * opaque IDs only — names and codes are fetched from ERP when the UI needs them.
 */
@Getter
@Setter
@Entity
@Table(name = "erp_gl_vouchers")
public class ErpGlVoucher extends StoreScopedEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "invoice_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Invoice invoice;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_input_run_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderInputRun orderInputRun;

	@Enumerated(EnumType.STRING)
	@Column(name = "voucher_category", nullable = false, length = 10)
	private ErpGlVoucherCategory voucherCategory = ErpGlVoucherCategory.JV;

	@Column(name = "voucher_number", nullable = false, length = 100)
	private String voucherNumber;

	@Column(name = "voucher_ref_no", length = 100)
	private String voucherRefNo;

	@Column(name = "erp_voucher_no", length = 100)
	private String erpVoucherNo;

	@Column(name = "voucher_date", nullable = false)
	private LocalDate voucherDate;

	@Column(name = "tax_month")
	private LocalDate taxMonth;

	@Column(name = "wht_month")
	private LocalDate whtMonth;

	@Column(name = "currency", length = 3)
	private String currency = "THB";

	@Column(name = "cheque_transfer_number", length = 100)
	private String chequeTransferNumber;

	@Column(name = "voucher_brief", length = 500)
	private String voucherBrief;

	@Lob
	@Column(name = "voucher_description", columnDefinition = "CLOB")
	private String voucherDescription;

	/**
	 * Nullable so Oracle {@code ddl-auto=update} can add the column on a non-empty
	 * table. A primitive {@code boolean} maps to NOT NULL with no DEFAULT, which
	 * raises ORA-01758.
	 */
	@Column(name = "no_tax_invoice")
	private Boolean noTaxInvoice = Boolean.FALSE;

	@Column(name = "reject_remark", length = 1000)
	private String rejectRemark;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private ErpGlVoucherStatus status = ErpGlVoucherStatus.DRAFT;

	/** ERP {@code ITEM_PART.PART_ID}. */
	@Column(name = "external_erp_item_id")
	private Long externalErpItemId;

	/** ERP {@code FM_GL_ACCOUNT.ACCOUNT_ID}. */
	@Column(name = "external_erp_account_code_id")
	private Long externalErpAccountCodeId;

	/** ERP {@code PUR_VENDOR.VENDOR_ID}. */
	@Column(name = "external_erp_vendor_id")
	private Long externalErpVendorId;

	@Lob
	@Column(name = "generate_error", columnDefinition = "CLOB")
	private String generateError;

	@OneToMany(mappedBy = "voucher", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id ASC")
	private List<ErpGlVoucherEntry> entries = new ArrayList<>();

	public void addEntry(ErpGlVoucherEntry entry) {
		entry.setVoucher(this);
		entries.add(entry);
	}
}
