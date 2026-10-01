package com.laconic.lacoinvoice.domain.models;

/** Local lifecycle of an ERP GL voucher record. */
public enum ErpGlVoucherStatus {
	/** Saved locally, voucher number not assigned yet. */
	DRAFT,
	/** Local record created with a voucher number; not posted to ERP. */
	GENERATED,
	/** Successfully posted to ERP GL. */
	POSTED,
	/** Generate or ERP post failed; see {@code generateError}. */
	FAILED
}
