package com.laconic.lacoinvoice.domain.models;

/** Old ERP {@code FM_GL_VOUCHER.VOUCHER_CATEGORY} values. */
public enum ErpGlVoucherCategory {
	/** AP Voucher — accounts payable (vendor bills / accrued expenses). */
	APV,
	/** AR Voucher — accounts receivable (customer invoices / revenue). */
	ARV,
	/** Payment Voucher — cash/bank out (paying a vendor). */
	PV,
	/** Receipt Voucher — cash/bank in (receiving from a customer). */
	RV,
	/** Journal Voucher — general journal adjustment. */
	JV
}
