package com.laconic.lacoinvoice.features.erp.lookup;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * In-memory ERP lookup catalog used when {@code USE_ERP_API=false}.
 * These records are not stored in the invoice database.
 */
@Service
@ConditionalOnProperty(name = "app.erp.enabled", havingValue = "false", matchIfMissing = true)
public class StubErpLookupService implements ErpLookupService {

	private static final List<ErpLookupItemDto> ITEMS = List.of(
			new ErpLookupItemDto(1001L, "FG-SHIP-FEE", "Shipping Fee Service"),
			new ErpLookupItemDto(1002L, "FG-COMMISSION", "Marketplace Commission"),
			new ErpLookupItemDto(1003L, "FG-ADS", "Advertising Fee"));

	private static final List<ErpLookupAccountDto> ACCOUNTS = List.of(
			new ErpLookupAccountDto(2101L, "2101-000", "Accounts Payable"),
			new ErpLookupAccountDto(2102L, "2102-000", "Accrued Expenses"),
			new ErpLookupAccountDto(1101L, "1101-000", "Bank - Kasikorn"),
			new ErpLookupAccountDto(11120010L, "11120010", "C/A- Kasikron 212-8-05026-7"),
			new ErpLookupAccountDto(11300010L, "11300010", "Trade accounts receivable-Domestic (ลูกหนี้การค้า-ในประเทศ)"),
			new ErpLookupAccountDto(21400070L, "21400070", "Out Put Tax-Unamortization (ภาษีขาย-รอเรียกเก็บ)"),
			new ErpLookupAccountDto(21400060L, "21400060", "Out Put Tax (ภาษีขาย)"),
			new ErpLookupAccountDto(4101L, "4101-000", "Sales Revenue"),
			new ErpLookupAccountDto(5101L, "5101-000", "Shipping Expense"),
			new ErpLookupAccountDto(5102L, "5102-000", "Commission Expense"));

	private static final List<ErpLookupVendorDto> VENDORS = List.of(
			new ErpLookupVendorDto(501L, "V-TIKTOK", "TikTok Shop (Thailand)"),
			new ErpLookupVendorDto(502L, "V-LAZADA", "Lazada Seller Services"),
			new ErpLookupVendorDto(503L, "V-SHOPEE", "Shopee (Thailand)"));

	private static final List<ErpLookupDepartmentDto> DEPARTMENTS = List.of(
			new ErpLookupDepartmentDto(1L, "N/A", "N/A"),
			new ErpLookupDepartmentDto(2L, "AC", "Accounting"),
			new ErpLookupDepartmentDto(3L, "SA", "Sales"),
			new ErpLookupDepartmentDto(4L, "WH", "Warehouse"));

	private static final List<ErpLookupCurrencyDto> CURRENCIES = List.of(
			new ErpLookupCurrencyDto(1L, "THB", "Thai Baht"),
			new ErpLookupCurrencyDto(2L, "USD", "US Dollar"),
			new ErpLookupCurrencyDto(3L, "JPY", "Japanese Yen"),
			new ErpLookupCurrencyDto(4L, "EUR", "Euro"));

	public List<ErpLookupItemDto> items(String search) {
		return ITEMS.stream().filter(item -> matches(search, item.code(), item.name())).toList();
	}

	public List<ErpLookupAccountDto> accounts(String search) {
		List<ErpLookupAccountDto> list = new ArrayList<>(
				ACCOUNTS.stream().filter(item -> matches(search, item.code(), item.name())).toList());
		if (list.isEmpty() && StringUtils.hasText(search)) {
			String clean = search.trim().replaceAll("[^0-9]", "");
			if (!clean.isEmpty()) {
				try {
					long id = Long.parseLong(clean);
					list.add(new ErpLookupAccountDto(id, search.trim(), "Account " + search.trim()));
				} catch (NumberFormatException ignored) {
				}
			}
		}
		return list;
	}

	public List<ErpLookupVendorDto> vendors(String search) {
		return VENDORS.stream().filter(item -> matches(search, item.code(), item.name())).toList();
	}

	public Optional<ErpLookupItemDto> item(Long id) {
		return ITEMS.stream().filter(item -> item.id().equals(id)).findFirst();
	}

	@Override
	public List<ErpLookupItemFinanceAccountDto> itemFinanceAccounts(Long itemId) {
		if (itemId == null) {
			return List.of();
		}
		if (itemId == 1001L) {
			return List.of(
					new ErpLookupItemFinanceAccountDto(
							10005L, "DOMESTIC", "DOMESTIC", true,
							5101L, "5101-000", "Shipping Expense",
							4101L, "4101-000", "Sales Revenue",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							2101L, "2101-000", "Accounts Payable",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							true),
					new ErpLookupItemFinanceAccountDto(
							1000672L, "DOMESTIC - OTHER", "DOMESTIC - OTHER", false,
							5101L, "5101-000", "Shipping Expense",
							4101L, "411302", "Other Income",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							2101L, "2101-000", "Accounts Payable",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							true));
		}
		if (itemId == 1002L) {
			return List.of(
					new ErpLookupItemFinanceAccountDto(
							10005L, "DOMESTIC", "DOMESTIC", true,
							5102L, "5102-000", "Commission Expense",
							4101L, "4101-000", "Sales Revenue",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							2101L, "2101-000", "Accounts Payable",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							true),
					new ErpLookupItemFinanceAccountDto(
							1000672L, "DOMESTIC - OTHER", "DOMESTIC - OTHER", false,
							5102L, "5102-000", "Commission Expense",
							4101L, "411302", "Other Income",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							2101L, "2101-000", "Accounts Payable",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							true));
		}
		if (itemId == 1003L) {
			return List.of(
					new ErpLookupItemFinanceAccountDto(
							10005L, "DOMESTIC", "DOMESTIC", true,
							5101L, "5101-000", "Shipping Expense",
							4101L, "4101-000", "Sales Revenue",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							2101L, "2101-000", "Accounts Payable",
							null, null, null,
							null, null, null,
							null, null, null,
							null, null, null,
							true));
		}
		// Default fallback for any other item
		return List.of(
				new ErpLookupItemFinanceAccountDto(
						10005L, "DOMESTIC", "DOMESTIC", true,
						5101L, "5101-000", "Expense Account",
						4101L, "4101-000", "Sales Revenue",
						null, null, null,
						null, null, null,
						null, null, null,
						null, null, null,
						null, null, null,
						2101L, "2101-000", "Accounts Payable",
						null, null, null,
						null, null, null,
						null, null, null,
						null, null, null,
						true));
	}

	public Optional<ErpLookupAccountDto> account(Long id) {
		var found = ACCOUNTS.stream().filter(item -> item.id().equals(id)).findFirst();
		if (found.isPresent()) {
			return found;
		}
		if (id != null && id > 0) {
			return Optional.of(new ErpLookupAccountDto(id, String.valueOf(id), "Account " + id));
		}
		return Optional.empty();
	}

	public Optional<ErpLookupVendorDto> vendor(Long id) {
		return VENDORS.stream().filter(item -> item.id().equals(id)).findFirst();
	}

	public List<ErpLookupDepartmentDto> departments(String search) {
		return DEPARTMENTS.stream().filter(item -> matches(search, item.code(), item.name())).toList();
	}

	public Optional<ErpLookupDepartmentDto> department(Long id) {
		return DEPARTMENTS.stream().filter(item -> item.id().equals(id)).findFirst();
	}

	public List<ErpLookupCurrencyDto> currencies(String search) {
		return CURRENCIES.stream().filter(item -> matches(search, item.code(), item.name())).toList();
	}

	public Optional<ErpLookupCurrencyDto> currency(Long id) {
		return CURRENCIES.stream().filter(item -> item.id().equals(id)).findFirst();
	}

	private static boolean matches(String search, String code, String name) {
		if (!StringUtils.hasText(search)) {
			return true;
		}
		String query = search.trim().toLowerCase(Locale.ROOT);
		return code.toLowerCase(Locale.ROOT).contains(query) || name.toLowerCase(Locale.ROOT).contains(query);
	}
}
