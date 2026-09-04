package com.laconic.lacoinvoice.features.erp;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.config.ErpProperties;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherEntry;
import com.laconic.lacoinvoice.features.erp.client.ErpPostVoucherEntryRequest;
import com.laconic.lacoinvoice.features.erp.client.ErpPostVoucherRequest;
import com.laconic.lacoinvoice.features.erp.client.ErpPostVoucherResponse;

@Service
@ConditionalOnProperty(name = "app.erp.enabled", havingValue = "true")
public class HttpErpPostService implements ErpPostService {

	private static final ParameterizedTypeReference<ApiResponse<ErpPostVoucherResponse>> POST_RESPONSE =
			new ParameterizedTypeReference<>() {
			};

	private final RestClient restClient;
	private final ErpProperties properties;

	public HttpErpPostService(@Qualifier("erpRestClient") RestClient restClient, ErpProperties properties) {
		this.restClient = restClient;
		this.properties = properties;
	}

	@Override
	public String post(ErpGlVoucher voucher) {
		ErpPostVoucherRequest request = toRequest(voucher);
		try {
			ApiResponse<ErpPostVoucherResponse> body = restClient.post()
					.uri("/api/common/gl-vouchers")
					.body(request)
					.retrieve()
					.body(POST_RESPONSE);
			if (body == null || body.getData() == null || !StringUtils.hasText(body.getData().getVoucherNo())) {
				throw new BadGatewayException("ERP post returned no voucher number");
			}
			return body.getData().getVoucherNo().trim();
		} catch (RestClientResponseException ex) {
			String detail = StringUtils.hasText(ex.getResponseBodyAsString())
					? ex.getResponseBodyAsString()
					: ex.getMessage();
			throw new BadGatewayException("ERP post failed — " + detail, ex);
		}
	}

	private ErpPostVoucherRequest toRequest(ErpGlVoucher voucher) {
		ErpPostVoucherRequest request = new ErpPostVoucherRequest();
		request.setVoucherDate(voucher.getVoucherDate());
		request.setVoucherCategory(voucher.getVoucherCategory() == null ? null : voucher.getVoucherCategory().name());
		request.setCurrency(voucher.getCurrency());
		request.setVoucherBrief(voucher.getVoucherBrief());
		request.setVoucherDescription(voucher.getVoucherDescription());
		request.setTaxMonth(voucher.getTaxMonth());
		request.setWhtMonth(voucher.getWhtMonth());
		request.setNoTaxInvoice(Boolean.TRUE.equals(voucher.getNoTaxInvoice()));
		request.setVendorId(voucher.getExternalErpVendorId());
		request.setChequeTransferNumber(voucher.getChequeTransferNumber());
		request.setCreatedBy(AuditUserContext.getCurrentUserId().orElse(properties.getPostedBy()));
		for (ErpGlVoucherEntry line : voucher.getEntries()) {
			ErpPostVoucherEntryRequest entry = new ErpPostVoucherEntryRequest();
			entry.setAccountId(line.getExternalErpAccountCodeId());
			entry.setDebit(line.getDebit());
			entry.setCredit(line.getCredit());
			entry.setInvoiceNo(line.getInvoiceNo());
			entry.setInvoiceDate(line.getInvoiceDate());
			entry.setNote(line.getNote());
			entry.setVendorId(
					line.getExternalErpVendorId() != null
							? line.getExternalErpVendorId()
							: voucher.getExternalErpVendorId());
			entry.setDepartmentId(line.getExternalErpDepartmentId());
			entry.setCurrencyId(line.getExternalErpCurrencyId());
			entry.setExchangeRate(line.getExchangeRate());
			request.getEntries().add(entry);
		}
		return request;
	}
}
