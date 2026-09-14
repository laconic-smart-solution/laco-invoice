package com.laconic.lacoinvoice.features.erp.lookup;

import java.util.List;
import java.util.Optional;

public interface ErpLookupService {

	List<ErpLookupItemDto> items(String search);

	Optional<ErpLookupItemDto> item(Long id);

	List<ErpLookupItemFinanceAccountDto> itemFinanceAccounts(Long itemId);

	List<ErpLookupAccountDto> accounts(String search);

	Optional<ErpLookupAccountDto> account(Long id);

	List<ErpLookupVendorDto> vendors(String search);

	Optional<ErpLookupVendorDto> vendor(Long id);

	List<ErpLookupDepartmentDto> departments(String search);

	Optional<ErpLookupDepartmentDto> department(Long id);

	List<ErpLookupCurrencyDto> currencies(String search);

	Optional<ErpLookupCurrencyDto> currency(Long id);
}
