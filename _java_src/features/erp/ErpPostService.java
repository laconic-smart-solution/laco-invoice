package com.laconic.lacoinvoice.features.erp;

import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;

public interface ErpPostService {

	/**
	 * Posts the local voucher to ERP. Returns the ERP voucher number.
	 */
	String post(ErpGlVoucher voucher);
}
