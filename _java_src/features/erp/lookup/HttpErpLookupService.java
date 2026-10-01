package com.laconic.lacoinvoice.features.erp.lookup;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.common.web.ApiResponse;

@Service
@ConditionalOnProperty(name = "app.erp.enabled", havingValue = "true")
public class HttpErpLookupService implements ErpLookupService {

	private static final ParameterizedTypeReference<ApiResponse<List<ErpLookupItemDto>>> ITEM_LIST =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<ErpLookupItemDto>> ITEM_ONE =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<List<ErpLookupItemFinanceAccountDto>>> ITEM_FINANCE_ACCOUNT_LIST =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<List<ErpLookupAccountDto>>> ACCOUNT_LIST =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<ErpLookupAccountDto>> ACCOUNT_ONE =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<List<ErpLookupVendorDto>>> VENDOR_LIST =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<ErpLookupVendorDto>> VENDOR_ONE =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<List<ErpLookupDepartmentDto>>> DEPARTMENT_LIST =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<ErpLookupDepartmentDto>> DEPARTMENT_ONE =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<List<ErpLookupCurrencyDto>>> CURRENCY_LIST =
			new ParameterizedTypeReference<>() {
			};
	private static final ParameterizedTypeReference<ApiResponse<ErpLookupCurrencyDto>> CURRENCY_ONE =
			new ParameterizedTypeReference<>() {
			};

	private final RestClient restClient;

	public HttpErpLookupService(@Qualifier("erpRestClient") RestClient restClient) {
		this.restClient = restClient;
	}

	@Override
	public List<ErpLookupItemDto> items(String search) {
		return list("/api/common/erp-lookups/items", search, ITEM_LIST);
	}

	@Override
	public Optional<ErpLookupItemDto> item(Long id) {
		return one("/api/common/erp-lookups/items/{id}", id, ITEM_ONE);
	}

	@Override
	public List<ErpLookupItemFinanceAccountDto> itemFinanceAccounts(Long itemId) {
		if (itemId == null) {
			return List.of();
		}
		try {
			ApiResponse<List<ErpLookupItemFinanceAccountDto>> body = restClient.get()
					.uri("/api/common/erp-lookups/items/{id}/finance-accounts", itemId)
					.retrieve()
					.body(ITEM_FINANCE_ACCOUNT_LIST);
			if (body == null || body.getData() == null) {
				return List.of();
			}
			return body.getData();
		} catch (RestClientResponseException ex) {
			if (ex.getStatusCode() == HttpStatus.NOT_FOUND || ex.getStatusCode().value() == 404) {
				return List.of();
			}
			throw erpFailure("ERP lookup failed: /api/common/erp-lookups/items/" + itemId + "/finance-accounts", ex);
		}
	}

	@Override
	public List<ErpLookupAccountDto> accounts(String search) {
		return list("/api/common/erp-lookups/account-codes", search, ACCOUNT_LIST);
	}

	@Override
	public Optional<ErpLookupAccountDto> account(Long id) {
		return one("/api/common/erp-lookups/account-codes/{id}", id, ACCOUNT_ONE);
	}

	@Override
	public List<ErpLookupVendorDto> vendors(String search) {
		return list("/api/common/erp-lookups/vendors", search, VENDOR_LIST);
	}

	@Override
	public Optional<ErpLookupVendorDto> vendor(Long id) {
		return one("/api/common/erp-lookups/vendors/{id}", id, VENDOR_ONE);
	}

	@Override
	public List<ErpLookupDepartmentDto> departments(String search) {
		return list("/api/common/erp-lookups/departments", search, DEPARTMENT_LIST);
	}

	@Override
	public Optional<ErpLookupDepartmentDto> department(Long id) {
		return one("/api/common/erp-lookups/departments/{id}", id, DEPARTMENT_ONE);
	}

	@Override
	public List<ErpLookupCurrencyDto> currencies(String search) {
		return list("/api/common/erp-lookups/currencies", search, CURRENCY_LIST);
	}

	@Override
	public Optional<ErpLookupCurrencyDto> currency(Long id) {
		return one("/api/common/erp-lookups/currencies/{id}", id, CURRENCY_ONE);
	}

	private <T> List<T> list(String path, String search, ParameterizedTypeReference<ApiResponse<List<T>>> type) {
		try {
			ApiResponse<List<T>> body = restClient.get()
					.uri(uriBuilder -> {
						uriBuilder.path(path);
						if (StringUtils.hasText(search)) {
							uriBuilder.queryParam("search", search.trim());
						}
						return uriBuilder.build();
					})
					.retrieve()
					.body(type);
			if (body == null || body.getData() == null) {
				return List.of();
			}
			return body.getData();
		} catch (RestClientResponseException ex) {
			throw erpFailure("ERP lookup failed: " + path, ex);
		}
	}

	private <T> Optional<T> one(String path, Long id, ParameterizedTypeReference<ApiResponse<T>> type) {
		if (id == null) {
			return Optional.empty();
		}
		try {
			ApiResponse<T> body = restClient.get()
					.uri(path, id)
					.retrieve()
					.body(type);
			return Optional.ofNullable(body).map(ApiResponse::getData);
		} catch (RestClientResponseException ex) {
			if (ex.getStatusCode() == HttpStatus.NOT_FOUND || ex.getStatusCode().value() == 404) {
				return Optional.empty();
			}
			throw erpFailure("ERP lookup failed: " + path, ex);
		}
	}

	private static BadGatewayException erpFailure(String prefix, RestClientResponseException ex) {
		String detail = StringUtils.hasText(ex.getResponseBodyAsString())
				? ex.getResponseBodyAsString()
				: ex.getMessage();
		return new BadGatewayException(prefix + " — " + detail, ex);
	}
}
