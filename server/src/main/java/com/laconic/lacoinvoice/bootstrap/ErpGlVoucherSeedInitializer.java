package com.laconic.lacoinvoice.bootstrap;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherCategory;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherEntry;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.ErpGlVoucherRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;

/**
 * Inserts a few sample GL vouchers against the stub ERP lookup IDs so the
 * Vouchers list is not empty during development.
 */
@Component
@Order(30)
public class ErpGlVoucherSeedInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ErpGlVoucherSeedInitializer.class);

	private static final Long ITEM_SHIPPING = 1001L;
	private static final Long ITEM_COMMISSION = 1002L;
	private static final Long ITEM_ADS = 1003L;
	private static final Long ACCOUNT_PAYABLE = 2101L;
	private static final Long ACCOUNT_ACCRUED = 2102L;
	private static final Long ACCOUNT_BANK = 1101L;
	private static final Long ACCOUNT_SHIPPING_EXPENSE = 5101L;
	private static final Long ACCOUNT_COMMISSION_EXPENSE = 5102L;
	private static final Long VENDOR_TIKTOK = 501L;
	private static final Long VENDOR_LAZADA = 502L;
	private static final Long VENDOR_SHOPEE = 503L;
	private static final Long DEPARTMENT_ACCOUNTING = 2L;
	private static final Long DEPARTMENT_SALES = 3L;
	private static final Long CURRENCY_THB = 1L;

	private final ErpGlVoucherRepository voucherRepository;
	private final StoreRepository storeRepository;

	public ErpGlVoucherSeedInitializer(
			ErpGlVoucherRepository voucherRepository,
			StoreRepository storeRepository) {
		this.voucherRepository = voucherRepository;
		this.storeRepository = storeRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		List<Store> stores = storeRepository.findByActiveTrue();
		seed(
				"APV-MOCK-001",
				ErpGlVoucherCategory.APV,
				ErpGlVoucherStatus.GENERATED,
				LocalDate.of(2026, 9, 1),
				"TikTok shipping fee — September",
				"Mock AP voucher for marketplace shipping charges.",
				ITEM_SHIPPING,
				ACCOUNT_PAYABLE,
				VENDOR_TIKTOK,
				storeAt(stores, 0),
				List.of(
						entry(ACCOUNT_SHIPPING_EXPENSE, "1250.00", "0", "INV-202609-001",
								LocalDate.of(2026, 9, 1), DEPARTMENT_SALES, VENDOR_TIKTOK),
						entry(ACCOUNT_PAYABLE, "0", "1250.00", "INV-202609-001",
								LocalDate.of(2026, 9, 1), DEPARTMENT_ACCOUNTING, VENDOR_TIKTOK)));
		seed(
				"APV-MOCK-002",
				ErpGlVoucherCategory.APV,
				ErpGlVoucherStatus.POSTED,
				LocalDate.of(2026, 8, 28),
				"Lazada marketplace commission",
				"Mock AP voucher for platform commission.",
				ITEM_COMMISSION,
				ACCOUNT_ACCRUED,
				VENDOR_LAZADA,
				storeAt(stores, 1),
				List.of(
						entry(ACCOUNT_COMMISSION_EXPENSE, "3840.00", "0", "INV-202608-014",
								LocalDate.of(2026, 8, 28), DEPARTMENT_SALES, VENDOR_LAZADA),
						entry(ACCOUNT_ACCRUED, "0", "3840.00", "INV-202608-014",
								LocalDate.of(2026, 8, 28), DEPARTMENT_ACCOUNTING, VENDOR_LAZADA)));
		seed(
				"PV-MOCK-001",
				ErpGlVoucherCategory.PV,
				ErpGlVoucherStatus.GENERATED,
				LocalDate.of(2026, 8, 15),
				"Shopee advertising fee payment",
				"Mock payment voucher clearing accrued ads expense.",
				ITEM_ADS,
				ACCOUNT_PAYABLE,
				VENDOR_SHOPEE,
				storeAt(stores, 2),
				List.of(
						entry(ACCOUNT_PAYABLE, "2500.00", "0", "INV-202608-008",
								LocalDate.of(2026, 8, 15), DEPARTMENT_ACCOUNTING, VENDOR_SHOPEE),
						entry(ACCOUNT_BANK, "0", "2500.00", "INV-202608-008",
								LocalDate.of(2026, 8, 15), DEPARTMENT_ACCOUNTING, VENDOR_SHOPEE)));
	}

	private void seed(
			String voucherNumber,
			ErpGlVoucherCategory category,
			ErpGlVoucherStatus status,
			LocalDate voucherDate,
			String brief,
			String description,
			Long itemId,
			Long accountId,
			Long vendorId,
			Store store,
			List<ErpGlVoucherEntry> entries) {
		if (voucherRepository.existsByVoucherNumberIgnoreCase(voucherNumber)) {
			return;
		}
		ErpGlVoucher voucher = new ErpGlVoucher();
		voucher.setStore(store);
		voucher.setVoucherCategory(category);
		voucher.setVoucherNumber(voucherNumber);
		voucher.setErpVoucherNo(voucherNumber);
		voucher.setVoucherDate(voucherDate);
		voucher.setTaxMonth(voucherDate.withDayOfMonth(1));
		voucher.setWhtMonth(voucherDate.withDayOfMonth(1));
		voucher.setCurrency("THB");
		voucher.setNoTaxInvoice(false);
		voucher.setVoucherBrief(brief);
		voucher.setVoucherDescription(description);
		voucher.setStatus(status);
		voucher.setExternalErpItemId(itemId);
		voucher.setExternalErpAccountCodeId(accountId);
		voucher.setExternalErpVendorId(vendorId);
		for (ErpGlVoucherEntry entry : entries) {
			voucher.addEntry(entry);
		}
		voucherRepository.save(voucher);
		log.info("Voucher seed: created {}", voucherNumber);
	}

	private static ErpGlVoucherEntry entry(
			Long accountId,
			String debit,
			String credit,
			String invoiceNo,
			LocalDate invoiceDate,
			Long departmentId,
			Long vendorId) {
		ErpGlVoucherEntry entry = new ErpGlVoucherEntry();
		entry.setExternalErpAccountCodeId(accountId);
		entry.setDebit(new BigDecimal(debit));
		entry.setCredit(new BigDecimal(credit));
		entry.setInvoiceNo(invoiceNo);
		entry.setInvoiceDate(invoiceDate);
		entry.setExternalErpDepartmentId(departmentId);
		entry.setExternalErpCurrencyId(CURRENCY_THB);
		entry.setExternalErpVendorId(vendorId);
		entry.setExchangeRate(BigDecimal.ONE);
		return entry;
	}

	private static Store storeAt(List<Store> stores, int index) {
		if (stores == null || stores.isEmpty()) {
			return null;
		}
		return stores.get(index % stores.size());
	}
}
