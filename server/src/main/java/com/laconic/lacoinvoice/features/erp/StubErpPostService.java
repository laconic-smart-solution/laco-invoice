package com.laconic.lacoinvoice.features.erp;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;

@Service
@ConditionalOnProperty(name = "app.erp.enabled", havingValue = "false", matchIfMissing = true)
public class StubErpPostService implements ErpPostService {

	@Override
	public String post(ErpGlVoucher voucher) {
		if (StringUtils.hasText(voucher.getErpVoucherNo())) {
			return voucher.getErpVoucherNo();
		}
		return voucher.getVoucherNumber();
	}
}
