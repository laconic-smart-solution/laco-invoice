package com.laconic.lacoinvoice.features.voucher;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherCategory;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherEntry;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherStatus;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.ErpGlVoucherEntryRepository;
import com.laconic.lacoinvoice.domain.repositories.ErpGlVoucherRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.erp.ErpPostService;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupService;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Objects;
import java.util.stream.Collectors;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.export.CsvExportWriter;
import com.laconic.lacoinvoice.common.export.ExcelExportWriter;
import com.laconic.lacoinvoice.common.export.ExcelExportWriter.SheetData;
import com.laconic.lacoinvoice.common.export.VoucherPdfWriter;
import com.laconic.lacoinvoice.common.pagination.SpecQuerySupport;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupAccountDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupCurrencyDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupDepartmentDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupItemDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupVendorDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherExportRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherInvoicePreviewRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDetailDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherEntryRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherGenerateRequest;
import com.laconic.lacoinvoice.features.voucher.pageable.ErpGlVoucherPageRequest;

import com.laconic.lacoinvoice.domain.models.OrderInputRun;
import com.laconic.lacoinvoice.domain.repositories.OrderInputRunRepository;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupItemFinanceAccountDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherPreviewDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherPreviewRequest;

@Service
public class ErpGlVoucherService {

	private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Bangkok");
	private static final String DEFAULT_CURRENCY = "THB";
	private static final Long DEFAULT_ERP_CURRENCY_ID = 1L;
	private static final Long DEFAULT_ERP_DEPARTMENT_ID = 1L;
	private static final BigDecimal MONEY_TOLERANCE = new BigDecimal("0.01");

	private static final Map<String, String> FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"voucherNumber", "voucherNumber",
			"voucherCategory", "voucherCategory",
			"status", "status");

	private final ErpGlVoucherRepository voucherRepository;
	private final ErpGlVoucherEntryRepository entryRepository;
	private final StoreRepository storeRepository;
	private final InvoiceRepository invoiceRepository;
	private final OrderInputRunRepository orderInputRunRepository;
	private final ErpLookupService erpLookupService;
	private final ErpPostService erpPostService;
	private final ErpGlVoucherMapper mapper;

	public ErpGlVoucherService(
			ErpGlVoucherRepository voucherRepository,
			ErpGlVoucherEntryRepository entryRepository,
			StoreRepository storeRepository,
			InvoiceRepository invoiceRepository,
			OrderInputRunRepository orderInputRunRepository,
			ErpLookupService erpLookupService,
			ErpPostService erpPostService,
			ErpGlVoucherMapper mapper) {
		this.voucherRepository = voucherRepository;
		this.entryRepository = entryRepository;
		this.storeRepository = storeRepository;
		this.invoiceRepository = invoiceRepository;
		this.orderInputRunRepository = orderInputRunRepository;
		this.erpLookupService = erpLookupService;
		this.erpPostService = erpPostService;
		this.mapper = mapper;
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<ErpGlVoucherDto>> page(ErpGlVoucherPageRequest request) {
		return PageQuerySupport.query(
				voucherRepository,
				mapper,
				request.toPageAndFilter(),
				ErpGlVoucher.class,
				request.getFilter(),
				FILTER_FIELD_PATHS);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpGlVoucherDetailDto getById(Long id) {
		ErpGlVoucher voucher = requireVoucher(id);
		return new ErpGlVoucherDetailDto(
				mapper.toDto(voucher),
				entryRepository.findByVoucher_IdOrderByIdAsc(id).stream().map(mapper::toEntryDto).toList());
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpGlVoucherDto generate(ErpGlVoucherGenerateRequest request) {
		requireErpIds(request);
		validateEntries(request.getEntries());

		Store store = null;
		if (request.getStoreId() != null) {
			store = storeRepository.findById(request.getStoreId())
					.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + request.getStoreId()));
		}

		Invoice invoice = null;
		if (request.getInvoiceId() != null) {
			if (!Boolean.TRUE.equals(request.getAllowDuplicate())
					&& voucherRepository.existsByInvoice_Id(request.getInvoiceId())) {
				throw new BusinessRuleException(
						"A voucher already exists for invoice id=" + request.getInvoiceId() + ".");
			}
			invoice = invoiceRepository.findById(request.getInvoiceId())
					.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + request.getInvoiceId()));
			if (store == null) {
				store = invoice.getStore();
			}
		}

		OrderInputRun orderInputRun = null;
		if (request.getOrderInputRunId() != null) {
			orderInputRun = orderInputRunRepository.findById(request.getOrderInputRunId())
					.orElseThrow(() -> new ResourceNotFoundException(
							"Order Data Input not found: id=" + request.getOrderInputRunId()));
			if (store == null) {
				store = orderInputRun.getStore();
			}
		}

		ErpGlVoucherCategory category = request.getVoucherCategory();
		String voucherNumber = nextVoucherNumber(category);

		ErpGlVoucher voucher = new ErpGlVoucher();
		applyRequest(voucher, request, store, invoice, orderInputRun);
		voucher.setVoucherNumber(voucherNumber);
		voucher.setErpVoucherNo(voucherNumber);
		voucher.setStatus(ErpGlVoucherStatus.GENERATED);
		replaceEntries(voucher, request);

		return mapper.toDto(voucherRepository.save(voucher));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpGlVoucherDto update(Long id, ErpGlVoucherGenerateRequest request) {
		ErpGlVoucher voucher = requireVoucher(id);
		if (voucher.getStatus() == ErpGlVoucherStatus.POSTED) {
			throw new IllegalArgumentException("Posted vouchers cannot be edited.");
		}
		requireErpIds(request);
		validateEntries(request.getEntries());

		Store store = null;
		if (request.getStoreId() != null) {
			store = storeRepository.findById(request.getStoreId())
					.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + request.getStoreId()));
		}

		Invoice invoice = voucher.getInvoice();
		if (request.getInvoiceId() != null) {
			if (voucherRepository.existsByInvoice_IdAndIdNot(request.getInvoiceId(), id)) {
				throw new BusinessRuleException(
						"A voucher already exists for invoice id=" + request.getInvoiceId() + ".");
			}
			invoice = invoiceRepository.findById(request.getInvoiceId())
					.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + request.getInvoiceId()));
			if (store == null) {
				store = invoice.getStore();
			}
		}

		OrderInputRun orderInputRun = voucher.getOrderInputRun();
		if (request.getOrderInputRunId() != null) {
			orderInputRun = orderInputRunRepository.findById(request.getOrderInputRunId())
					.orElseThrow(() -> new ResourceNotFoundException(
							"Order Data Input not found: id=" + request.getOrderInputRunId()));
			if (store == null) {
				store = orderInputRun.getStore();
			}
		}

		applyRequest(voucher, request, store, invoice, orderInputRun);
		if (voucher.getStatus() == ErpGlVoucherStatus.FAILED) {
			voucher.setStatus(ErpGlVoucherStatus.GENERATED);
			voucher.setGenerateError(null);
		}
		replaceEntries(voucher, request);
		return mapper.toDto(voucherRepository.save(voucher));
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<ErpGlVoucherDto> getByOrderInputRunId(Long runId) {
		return voucherRepository.findByOrderInputRun_IdOrderByIdDesc(runId).stream()
				.map(mapper::toDto)
				.toList();
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<ErpGlVoucherDto> getByInvoiceId(Long invoiceId) {
		if (!invoiceRepository.existsById(invoiceId)) {
			throw new ResourceNotFoundException("Invoice not found: id=" + invoiceId);
		}
		return voucherRepository.findByInvoice_IdOrderByIdDesc(invoiceId).stream()
				.map(mapper::toDto)
				.toList();
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpGlVoucherPreviewDto previewFromInvoice(ErpGlVoucherInvoicePreviewRequest request) {
		Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
				.orElseThrow(() -> new ResourceNotFoundException(
						"Invoice not found: id=" + request.getInvoiceId()));
		BigDecimal totalAmount = money(invoice.getGrandTotal());
		if (totalAmount.signum() == 0) {
			throw new BusinessRuleException("Invoice total must be nonzero before voucher preview.");
		}

		Long itemId = request.getExternalErpItemId();
		if (itemId == null) {
			List<ErpLookupItemDto> items = erpLookupService.items(null);
			if (items.size() == 1) {
				itemId = items.get(0).id();
			} else {
				throw new BusinessRuleException(
						"ERP item mapping cannot be inferred. Select externalErpItemId.");
			}
		}
		ErpLookupItemDto item = erpLookupService.item(itemId)
				.orElseThrow(() -> new BusinessRuleException("Selected ERP item was not found."));
		List<ErpLookupItemFinanceAccountDto> financeAccounts = erpLookupService.itemFinanceAccounts(itemId);
		ErpLookupItemFinanceAccountDto finance = selectFinanceAccount(
				financeAccounts, request.getTradingPartnerTypeId());

		Long debitAccountId = request.getDebitAccountId();
		if (debitAccountId == null && finance != null) {
			debitAccountId = "SALE".equalsIgnoreCase(request.getAccountType())
					? finance.saleAccountId()
					: finance.purchaseAccountId();
		}
		Long creditAccountId = request.getCreditAccountId();
		if (creditAccountId == null && finance != null) {
			creditAccountId = finance.saleAccountId();
		}
		if (debitAccountId == null) {
			throw new BusinessRuleException(
					"Debit account mapping cannot be inferred. Select debitAccountId.");
		}
		if (creditAccountId == null) {
			throw new BusinessRuleException(
					"Credit account mapping cannot be inferred. Select creditAccountId.");
		}
		ErpLookupAccountDto creditAccount = erpLookupService.account(creditAccountId)
				.orElseThrow(() -> new BusinessRuleException(
						"Selected ERP credit account was not found."));
		erpLookupService.account(debitAccountId)
				.orElseThrow(() -> new BusinessRuleException(
						"Selected ERP debit account was not found."));

		Long vendorId = resolveInvoiceVendorId(invoice, request.getExternalErpVendorId());
		ErpLookupVendorDto vendor = erpLookupService.vendor(vendorId)
				.orElseThrow(() -> new BusinessRuleException("ERP vendor not found: id=" + vendorId));
		Long departmentId = resolveInvoiceDepartmentId(request.getExternalErpDepartmentId());
		Long currencyId = resolveInvoiceCurrencyId(invoice, request.getExternalErpCurrencyId());

		LocalDate invoiceDate = invoice.getEndDate();
		LocalDate voucherDate = invoiceDate != null ? invoiceDate : LocalDate.now(BUSINESS_ZONE);
		LocalDate taxMonth = voucherDate.withDayOfMonth(1);
		boolean noTaxInvoice = Boolean.TRUE.equals(request.getNoTaxInvoice());

		ErpGlVoucherEntryRequest debit = previewEntry(
				debitAccountId, totalAmount, BigDecimal.ZERO, invoice, invoiceDate,
				vendorId, departmentId, currencyId);
		ErpGlVoucherEntryRequest credit = previewEntry(
				creditAccountId, BigDecimal.ZERO, totalAmount, invoice, invoiceDate,
				vendorId, departmentId, currencyId);
		List<ErpGlVoucherEntryRequest> entries = List.of(debit, credit);

		Store store = invoice.getStore();
		String brief = "Invoice: " + invoice.getInvoiceNumber();
		String description = StringUtils.hasText(invoice.getTitle())
				? invoice.getTitle().trim()
				: brief;
		return new ErpGlVoucherPreviewDto(
				store != null ? store.getId() : null,
				store != null ? store.getName() : null,
				null,
				null,
				ErpGlVoucherCategory.JV,
				voucherDate,
				taxMonth,
				taxMonth,
				invoice.getCurrency(),
				brief,
				description,
				noTaxInvoice,
				itemId,
				item.code(),
				item.name(),
				creditAccountId,
				creditAccount.code(),
				creditAccount.name(),
				vendorId,
				vendor.code(),
				vendor.name(),
				departmentId,
				currencyId,
				totalAmount,
				totalAmount,
				totalAmount,
				entries,
				financeAccounts,
				invoice.getId(),
				invoice.getInvoiceNumber());
	}

	private ErpLookupItemFinanceAccountDto selectFinanceAccount(
			List<ErpLookupItemFinanceAccountDto> accounts,
			Long tradingPartnerTypeId) {
		if (accounts == null || accounts.isEmpty()) {
			return null;
		}
		if (tradingPartnerTypeId != null) {
			return accounts.stream()
					.filter(account -> tradingPartnerTypeId.equals(account.tradingPartnerTypeId()))
					.findFirst()
					.orElse(null);
		}
		return accounts.size() == 1 ? accounts.get(0) : null;
	}

	private Long resolveInvoiceVendorId(Invoice invoice, Long selectedId) {
		if (selectedId != null) {
			return selectedId;
		}
		String marketplaceCode = invoice.getMarketplace() != null
				? invoice.getMarketplace().getCode()
				: null;
		List<ErpLookupVendorDto> matches = erpLookupService.vendors(marketplaceCode);
		if (matches.size() == 1) {
			return matches.get(0).id();
		}
		throw new BusinessRuleException(
				"ERP vendor mapping cannot be inferred. Select externalErpVendorId.");
	}

	private Long resolveInvoiceDepartmentId(Long selectedId) {
		if (selectedId != null) {
			erpLookupService.department(selectedId)
					.orElseThrow(() -> new BusinessRuleException("Selected ERP department was not found."));
			return selectedId;
		}
		List<ErpLookupDepartmentDto> departments = erpLookupService.departments(null);
		if (departments.size() == 1) {
			return departments.get(0).id();
		}
		throw new BusinessRuleException(
				"ERP department mapping cannot be inferred. Select externalErpDepartmentId.");
	}

	private Long resolveInvoiceCurrencyId(Invoice invoice, Long selectedId) {
		if (selectedId != null) {
			erpLookupService.currency(selectedId)
					.orElseThrow(() -> new BusinessRuleException("Selected ERP currency was not found."));
			return selectedId;
		}
		List<ErpLookupCurrencyDto> currencies = erpLookupService.currencies(invoice.getCurrency());
		List<ErpLookupCurrencyDto> exact = currencies.stream()
				.filter(currency -> invoice.getCurrency() != null
						&& invoice.getCurrency().equalsIgnoreCase(currency.code()))
				.toList();
		if (exact.size() == 1) {
			return exact.get(0).id();
		}
		throw new BusinessRuleException(
				"ERP currency mapping cannot be inferred. Select externalErpCurrencyId.");
	}

	private ErpGlVoucherEntryRequest previewEntry(
			Long accountId,
			BigDecimal debit,
			BigDecimal credit,
			Invoice invoice,
			LocalDate invoiceDate,
			Long vendorId,
			Long departmentId,
			Long currencyId) {
		ErpGlVoucherEntryRequest entry = new ErpGlVoucherEntryRequest();
		entry.setExternalErpAccountCodeId(accountId);
		entry.setDebit(debit);
		entry.setCredit(credit);
		entry.setInvoiceNo(invoice.getInvoiceNumber());
		entry.setInvoiceDate(invoiceDate);
		entry.setNote(invoice.getTitle());
		entry.setExternalErpVendorId(vendorId);
		entry.setExternalErpDepartmentId(departmentId);
		entry.setExternalErpCurrencyId(currencyId);
		entry.setExchangeRate(BigDecimal.ONE);
		return entry;
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpGlVoucherPreviewDto previewFromOrderInput(ErpGlVoucherPreviewRequest request) {
		if (request == null || request.getOrderInputRunId() == null) {
			throw new IllegalArgumentException("orderInputRunId is required for preview");
		}
		OrderInputRun run = orderInputRunRepository.findById(request.getOrderInputRunId())
				.orElseThrow(() -> new ResourceNotFoundException(
						"Order Data Input not found: id=" + request.getOrderInputRunId()));

		Store store = run.getStore();
		Long storeId = store != null ? store.getId() : null;
		String storeName = store != null ? store.getName() : null;

		BigDecimal totalAmount = run.getInvoiceTotalAmount();
		if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
			totalAmount = run.getExcelMatchedAmount();
		}
		if (totalAmount == null) {
			totalAmount = BigDecimal.ZERO;
		}

		String invoiceNo = StringUtils.hasText(run.getInvoiceReceiptNumber()) ? run.getInvoiceReceiptNumber().trim() : null;
		LocalDate invoiceDate = run.getInvoiceReceiptDate();
		LocalDate voucherDate = invoiceDate != null ? invoiceDate : LocalDate.now(BUSINESS_ZONE);
		LocalDate taxMonth = invoiceDate != null ? invoiceDate.withDayOfMonth(1) : LocalDate.now(BUSINESS_ZONE).withDayOfMonth(1);
		LocalDate whtMonth = taxMonth;

		ErpGlVoucherCategory voucherCategory = ErpGlVoucherCategory.JV;
		String voucherBrief = "Order Data Input: " + (StringUtils.hasText(run.getTitle()) ? run.getTitle().trim() : "Run #" + run.getId());
		String voucherDescription = "Order Data Input #" + run.getId() + " (" + run.getTitle() + ")"
				+ (invoiceNo != null ? " | Receipt: " + invoiceNo : "")
				+ (totalAmount.compareTo(BigDecimal.ZERO) > 0 ? " | Amount: " + totalAmount + " THB" : "");

		// Resolve ERP Item
		Long itemId = request.getExternalErpItemId();
		if (itemId == null) {
			List<ErpLookupItemDto> availableItems = erpLookupService.items(null);
			if (!availableItems.isEmpty()) {
				itemId = availableItems.get(0).id();
			} else {
				itemId = 1001L;
			}
		}

		String itemCode = null;
		String itemName = null;
		var itemOpt = erpLookupService.item(itemId);
		if (itemOpt.isPresent()) {
			itemCode = itemOpt.get().code();
			itemName = itemOpt.get().name();
		}

		// Fetch ERP Item Finance Info
		List<ErpLookupItemFinanceAccountDto> financeAccounts = erpLookupService.itemFinanceAccounts(itemId);

		// Resolve Debit Account from Finance Info
		Long debitAccountId = request.getDebitAccountId();
		if (debitAccountId == null && !financeAccounts.isEmpty()) {
			ErpLookupItemFinanceAccountDto targetRow = null;
			if (request.getTradingPartnerTypeId() != null) {
				targetRow = financeAccounts.stream()
						.filter(fa -> fa.tradingPartnerTypeId() != null
								&& fa.tradingPartnerTypeId().equals(request.getTradingPartnerTypeId()))
						.findFirst().orElse(null);
			}
			if (targetRow == null) {
				targetRow = financeAccounts.stream()
						.filter(fa -> "DOMESTIC".equalsIgnoreCase(fa.tradingPartnerTypeCode()))
						.findFirst()
						.orElse(financeAccounts.get(0));
			}
			if ("SALE".equalsIgnoreCase(request.getAccountType()) && targetRow.saleAccountId() != null) {
				debitAccountId = targetRow.saleAccountId();
			} else if (targetRow.purchaseAccountId() != null) {
				debitAccountId = targetRow.purchaseAccountId();
			} else if (targetRow.saleAccountId() != null) {
				debitAccountId = targetRow.saleAccountId();
			}
		}
		if (debitAccountId == null) {
			debitAccountId = 5101L;
		}

		// Resolve Credit Account
		Long creditAccountId = request.getCreditAccountId();
		if (creditAccountId == null) {
			creditAccountId = 2101L;
		}

		String accountCode = null;
		String accountTitle = null;
		var accOpt = erpLookupService.account(creditAccountId);
		if (accOpt.isPresent()) {
			accountCode = accOpt.get().code();
			accountTitle = accOpt.get().name();
		}

		// Resolve Vendor
		Long vendorId = request.getExternalErpVendorId();
		if (vendorId == null) {
			String marketCode = run.getMarketplace() != null && run.getMarketplace().getCode() != null
					? run.getMarketplace().getCode().toUpperCase()
					: "";
			if (marketCode.contains("TIKTOK")) {
				vendorId = 501L;
			} else if (marketCode.contains("LAZADA")) {
				vendorId = 502L;
			} else if (marketCode.contains("SHOPEE")) {
				vendorId = 503L;
			} else {
				List<ErpLookupVendorDto> vendors = erpLookupService.vendors(null);
				vendorId = !vendors.isEmpty() ? vendors.get(0).id() : 501L;
			}
		}

		String vendorCode = null;
		String vendorName = null;
		var vendorOpt = erpLookupService.vendor(vendorId);
		if (vendorOpt.isPresent()) {
			vendorCode = vendorOpt.get().code();
			vendorName = vendorOpt.get().name();
		}

		Long departmentId = request.getExternalErpDepartmentId() != null
				? request.getExternalErpDepartmentId()
				: DEFAULT_ERP_DEPARTMENT_ID;
		Long currencyId = request.getExternalErpCurrencyId() != null
				? request.getExternalErpCurrencyId()
				: DEFAULT_ERP_CURRENCY_ID;

		boolean noTaxInvoice = Boolean.TRUE.equals(request.getNoTaxInvoice());
		boolean hasVat = !noTaxInvoice && totalAmount.compareTo(BigDecimal.ZERO) > 0;
		BigDecimal vatAmount = BigDecimal.ZERO;
		if (hasVat) {
			// VAT 7% Inclusive: Total Amount * 7 / 107
			vatAmount = totalAmount.multiply(BigDecimal.valueOf(7))
					.divide(BigDecimal.valueOf(107), 2, RoundingMode.HALF_UP);
		}

		Long vatDebitAccountId = resolveAccountId("21400070", 21400070L);
		Long vatCreditAccountId = resolveAccountId("21400060", 21400060L);

		// Balanced entry lines: Line 1 (Debit Principal), Line 2 (Debit VAT Unamortization),
		// Line 3 (Credit Principal), Line 4 (Credit Output Tax)
		List<ErpGlVoucherEntryRequest> entries = new ArrayList<>();

		// Line 1: Principal Debit
		ErpGlVoucherEntryRequest debitLine = new ErpGlVoucherEntryRequest();
		debitLine.setExternalErpAccountCodeId(debitAccountId);
		debitLine.setDebit(totalAmount);
		debitLine.setCredit(BigDecimal.ZERO);
		debitLine.setInvoiceNo(invoiceNo);
		debitLine.setInvoiceDate(invoiceDate);
		debitLine.setExternalErpDepartmentId(departmentId);
		debitLine.setExternalErpCurrencyId(currencyId);
		debitLine.setExchangeRate(BigDecimal.ONE);
		debitLine.setExternalErpVendorId(vendorId);
		entries.add(debitLine);

		// Line 2: VAT 7% Debit (Out Put Tax-Unamortization / ภาษีขาย-รอเรียกเก็บ)
		if (hasVat && vatAmount.compareTo(BigDecimal.ZERO) > 0) {
			ErpGlVoucherEntryRequest vatDebitLine = new ErpGlVoucherEntryRequest();
			vatDebitLine.setExternalErpAccountCodeId(vatDebitAccountId);
			vatDebitLine.setDebit(vatAmount);
			vatDebitLine.setCredit(BigDecimal.ZERO);
			vatDebitLine.setInvoiceNo(invoiceNo);
			vatDebitLine.setInvoiceDate(invoiceDate);
			vatDebitLine.setExternalErpDepartmentId(departmentId);
			vatDebitLine.setExternalErpCurrencyId(currencyId);
			vatDebitLine.setExchangeRate(BigDecimal.ONE);
			vatDebitLine.setExternalErpVendorId(vendorId);
			entries.add(vatDebitLine);
		}

		// Line 3: Principal Credit
		ErpGlVoucherEntryRequest creditLine = new ErpGlVoucherEntryRequest();
		creditLine.setExternalErpAccountCodeId(creditAccountId);
		creditLine.setDebit(BigDecimal.ZERO);
		creditLine.setCredit(totalAmount);
		creditLine.setInvoiceNo(invoiceNo);
		creditLine.setInvoiceDate(invoiceDate);
		creditLine.setExternalErpDepartmentId(departmentId);
		creditLine.setExternalErpCurrencyId(currencyId);
		creditLine.setExchangeRate(BigDecimal.ONE);
		creditLine.setExternalErpVendorId(vendorId);
		entries.add(creditLine);

		// Line 4: VAT 7% Credit (Out Put Tax / ภาษีขาย)
		if (hasVat && vatAmount.compareTo(BigDecimal.ZERO) > 0) {
			ErpGlVoucherEntryRequest vatCreditLine = new ErpGlVoucherEntryRequest();
			vatCreditLine.setExternalErpAccountCodeId(vatCreditAccountId);
			vatCreditLine.setDebit(BigDecimal.ZERO);
			vatCreditLine.setCredit(vatAmount);
			vatCreditLine.setInvoiceNo(invoiceNo);
			vatCreditLine.setInvoiceDate(invoiceDate);
			vatCreditLine.setExternalErpDepartmentId(departmentId);
			vatCreditLine.setExternalErpCurrencyId(currencyId);
			vatCreditLine.setExchangeRate(BigDecimal.ONE);
			vatCreditLine.setExternalErpVendorId(vendorId);
			entries.add(vatCreditLine);
		}

		BigDecimal debitTotal = entries.stream()
				.map(e -> e.getDebit() != null ? e.getDebit() : BigDecimal.ZERO)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal creditTotal = entries.stream()
				.map(e -> e.getCredit() != null ? e.getCredit() : BigDecimal.ZERO)
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		return new ErpGlVoucherPreviewDto(
				storeId,
				storeName,
				run.getId(),
				run.getTitle(),
				voucherCategory,
				voucherDate,
				taxMonth,
				whtMonth,
				DEFAULT_CURRENCY,
				voucherBrief,
				voucherDescription,
				noTaxInvoice,
				itemId,
				itemCode,
				itemName,
				creditAccountId,
				accountCode,
				accountTitle,
				vendorId,
				vendorCode,
				vendorName,
				departmentId,
				currencyId,
				totalAmount,
				debitTotal,
				creditTotal,
				entries,
				financeAccounts,
				null,
				null);
	}

	private Long resolveAccountId(String code, Long fallbackId) {
		if (!StringUtils.hasText(code)) {
			return fallbackId;
		}
		try {
			var matches = erpLookupService.accounts(code);
			if (matches != null && !matches.isEmpty()) {
				for (var acc : matches) {
					if (code.equalsIgnoreCase(acc.code())) {
						return acc.id();
					}
				}
				return matches.get(0).id();
			}
		} catch (Exception ignored) {
		}
		return fallbackId;
	}

	/**
	 * Posts the voucher to ERP when {@code USE_ERP_API=true}; otherwise marks it
	 * posted locally using the mock catalog.
	 */
	@Loggable
	@Transactional(noRollbackFor = BadGatewayException.class)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ErpGlVoucherDto postToErp(Long id) {
		ErpGlVoucher voucher = requireVoucher(id);
		if (voucher.getStatus() == ErpGlVoucherStatus.POSTED) {
			throw new IllegalArgumentException("Voucher is already posted to ERP.");
		}
		if (voucher.getStatus() == ErpGlVoucherStatus.DRAFT) {
			throw new IllegalArgumentException("Generate the voucher before posting to ERP.");
		}
		try {
			voucher.getEntries().size();
			String erpVoucherNo = erpPostService.post(voucher);
			voucher.setStatus(ErpGlVoucherStatus.POSTED);
			voucher.setGenerateError(null);
			voucher.setErpVoucherNo(StringUtils.hasText(erpVoucherNo) ? erpVoucherNo : voucher.getVoucherNumber());
		} catch (RuntimeException ex) {
			voucher.setStatus(ErpGlVoucherStatus.FAILED);
			voucher.setGenerateError(ex.getMessage());
			voucherRepository.save(voucher);
			if (ex instanceof BadGatewayException) {
				throw ex;
			}
			throw new BadGatewayException(
					ex.getMessage() != null ? ex.getMessage() : "ERP post failed", ex);
		}
		return mapper.toDto(voucherRepository.save(voucher));
	}

	private void applyRequest(
			ErpGlVoucher voucher,
			ErpGlVoucherGenerateRequest request,
			Store store,
			Invoice invoice,
			OrderInputRun orderInputRun) {
		voucher.setStore(store);
		voucher.setInvoice(invoice);
		voucher.setOrderInputRun(orderInputRun);
		voucher.setVoucherCategory(request.getVoucherCategory());
		voucher.setVoucherDate(request.getVoucherDate());
		voucher.setTaxMonth(request.getTaxMonth());
		voucher.setWhtMonth(request.getWhtMonth());
		voucher.setCurrency(StringUtils.hasText(request.getCurrency()) ? request.getCurrency().trim() : DEFAULT_CURRENCY);
		voucher.setChequeTransferNumber(trimToNull(request.getChequeTransferNumber()));
		voucher.setVoucherBrief(request.getVoucherBrief().trim());
		voucher.setVoucherDescription(trimToNull(request.getVoucherDescription()));
		voucher.setNoTaxInvoice(Boolean.TRUE.equals(request.getNoTaxInvoice()));
		voucher.setRejectRemark(trimToNull(request.getRejectRemark()));
		voucher.setExternalErpItemId(request.getExternalErpItemId());
		voucher.setExternalErpAccountCodeId(request.getExternalErpAccountCodeId());
		voucher.setExternalErpVendorId(request.getExternalErpVendorId());
	}

	private void replaceEntries(ErpGlVoucher voucher, ErpGlVoucherGenerateRequest request) {
		voucher.getEntries().clear();
		for (ErpGlVoucherEntryRequest line : request.getEntries()) {
			ErpGlVoucherEntry entry = new ErpGlVoucherEntry();
			entry.setExternalErpAccountCodeId(line.getExternalErpAccountCodeId());
			entry.setDebit(nonNull(line.getDebit()));
			entry.setCredit(nonNull(line.getCredit()));
			entry.setInvoiceNo(trimToNull(line.getInvoiceNo()));
			entry.setInvoiceDate(line.getInvoiceDate());
			entry.setNote(trimToNull(line.getNote()));
			entry.setExternalErpVendorId(
					line.getExternalErpVendorId() != null ? line.getExternalErpVendorId() : request.getExternalErpVendorId());
			entry.setExternalErpDepartmentId(
					line.getExternalErpDepartmentId() != null
							? line.getExternalErpDepartmentId()
							: DEFAULT_ERP_DEPARTMENT_ID);
			entry.setExternalErpCurrencyId(
					line.getExternalErpCurrencyId() != null ? line.getExternalErpCurrencyId() : DEFAULT_ERP_CURRENCY_ID);
			entry.setExchangeRate(line.getExchangeRate() != null ? line.getExchangeRate() : BigDecimal.ONE);
			voucher.addEntry(entry);
		}
	}

	private void requireErpIds(ErpGlVoucherGenerateRequest request) {
		erpLookupService.item(request.getExternalErpItemId())
				.orElseThrow(() -> new IllegalArgumentException(
						"ERP item not found: id=" + request.getExternalErpItemId()));
		if (request.getExternalErpAccountCodeId() == null || request.getExternalErpAccountCodeId() <= 0) {
			throw new IllegalArgumentException("Account code is required.");
		}
		erpLookupService.account(request.getExternalErpAccountCodeId())
				.orElseGet(() -> new ErpLookupAccountDto(
						request.getExternalErpAccountCodeId(),
						String.valueOf(request.getExternalErpAccountCodeId()),
						"Account " + request.getExternalErpAccountCodeId()));
		erpLookupService.vendor(request.getExternalErpVendorId())
				.orElseThrow(() -> new IllegalArgumentException(
						"ERP vendor not found: id=" + request.getExternalErpVendorId()));
	}

	private void validateEntries(List<ErpGlVoucherEntryRequest> entries) {
		BigDecimal debitTotal = BigDecimal.ZERO;
		BigDecimal creditTotal = BigDecimal.ZERO;
		for (ErpGlVoucherEntryRequest line : entries) {
			if (line.getExternalErpAccountCodeId() == null || line.getExternalErpAccountCodeId() <= 0) {
				throw new IllegalArgumentException("Account code is required for each entry line.");
			}
			erpLookupService.account(line.getExternalErpAccountCodeId())
					.orElseGet(() -> new ErpLookupAccountDto(
							line.getExternalErpAccountCodeId(),
							String.valueOf(line.getExternalErpAccountCodeId()),
							"Account " + line.getExternalErpAccountCodeId()));
			BigDecimal debit = nonNull(line.getDebit());
			BigDecimal credit = nonNull(line.getCredit());
			if (debit.signum() < 0 || credit.signum() < 0) {
				throw new IllegalArgumentException("Debit and credit must be zero or positive.");
			}
			if (debit.signum() > 0 && credit.signum() > 0) {
				throw new IllegalArgumentException("An entry cannot have both debit and credit amounts.");
			}
			if (debit.signum() == 0 && credit.signum() == 0) {
				throw new IllegalArgumentException("Each entry must have a debit or credit amount.");
			}
			if (line.getExternalErpDepartmentId() != null) {
				erpLookupService.department(line.getExternalErpDepartmentId())
						.orElseThrow(() -> new IllegalArgumentException(
								"ERP department not found: id=" + line.getExternalErpDepartmentId()));
			}
			Long currencyId = line.getExternalErpCurrencyId() != null
					? line.getExternalErpCurrencyId()
					: DEFAULT_ERP_CURRENCY_ID;
			erpLookupService.currency(currencyId)
					.orElseThrow(() -> new IllegalArgumentException("ERP currency not found: id=" + currencyId));
			BigDecimal rate = line.getExchangeRate() != null ? line.getExchangeRate() : BigDecimal.ONE;
			if (rate.signum() <= 0) {
				throw new IllegalArgumentException("Exchange rate must be greater than zero.");
			}
			debitTotal = debitTotal.add(debit);
			creditTotal = creditTotal.add(credit);
		}
		if (debitTotal.subtract(creditTotal).abs().compareTo(MONEY_TOLERANCE) > 0) {
			throw new IllegalArgumentException(
					"Voucher entries are not balanced. Debit " + debitTotal + " vs credit " + creditTotal + ".");
		}
	}

	private String nextVoucherNumber(ErpGlVoucherCategory category) {
		LocalDate today = LocalDate.now(BUSINESS_ZONE);
		String prefix = "%s-%d%02d-".formatted(category.name(), today.getYear(), today.getMonthValue());
		int next = voucherRepository.findByVoucherNumberStartingWithIgnoreCase(prefix).stream()
				.map(voucher -> voucher.getVoucherNumber().substring(prefix.length()))
				.mapToInt(ErpGlVoucherService::parseSuffix)
				.max()
				.orElse(0) + 1;
		return prefix + "%03d".formatted(next);
	}

	private ErpGlVoucher requireVoucher(Long id) {
		return voucherRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Voucher not found: id=" + id));
	}

	private static int parseSuffix(String value) {
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException ex) {
			return 0;
		}
	}

	private static BigDecimal nonNull(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private static BigDecimal money(BigDecimal value) {
		return nonNull(value).setScale(2, RoundingMode.HALF_UP);
	}

	private static final int MAX_EXPORT_ROWS = 5000;
	private static final DateTimeFormatter EXPORT_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

	private static final List<String> VOUCHERS_HEADERS = List.of(
			"Voucher No.",
			"ERP Voucher No.",
			"Category",
			"Voucher Date",
			"Tax Month",
			"WHT Month",
			"Store",
			"Currency",
			"Debit Total",
			"Credit Total",
			"Status",
			"Brief",
			"Description",
			"ERP Item ID",
			"Item Code",
			"Item Name",
			"ERP Vendor ID",
			"Vendor Code",
			"Vendor Name",
			"ERP Account ID",
			"Account Code",
			"Account Name",
			"Cheque / Transfer No.",
			"No Tax Invoice",
			"Reject Remark",
			"Invoice ID",
			"Invoice No.");

	private static final List<String> VOUCHER_LINES_HEADERS = List.of(
			"Local Voucher No.",
			"Line No.",
			"ERP Voucher No.",
			"Voucher Date",
			"Category",
			"ERP Account ID",
			"Account Code",
			"Account Name",
			"Debit",
			"Credit",
			"ERP Vendor ID",
			"Vendor Code",
			"Vendor Name",
			"ERP Item ID",
			"Item Code",
			"Item Name",
			"ERP Department ID",
			"Department Code",
			"Department Name",
			"Currency",
			"Exchange Rate",
			"Invoice No.",
			"Invoice Date",
			"Line Note",
			"Status");

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportExcel(ErpGlVoucherExportRequest request) {
		List<ErpGlVoucher> vouchers = resolveVouchersForExport(request);
		if (vouchers.isEmpty()) {
			throw new BusinessRuleException("No vouchers found to export.");
		}

		ExportLookups lookups = buildLookups();
		List<List<Object>> vouchersRows = buildVouchersRows(vouchers, lookups);
		List<List<Object>> linesRows = buildLinesRows(vouchers, lookups);

		return ExcelExportWriter.writeSheets(List.of(
				new SheetData("Vouchers", VOUCHERS_HEADERS, vouchersRows),
				new SheetData("Voucher_Lines", VOUCHER_LINES_HEADERS, linesRows)));
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportCsv(ErpGlVoucherExportRequest request) {
		List<ErpGlVoucher> vouchers = resolveVouchersForExport(request);
		if (vouchers.isEmpty()) {
			throw new BusinessRuleException("No vouchers found to export.");
		}

		ExportLookups lookups = buildLookups();
		List<List<Object>> linesRows = buildLinesRows(vouchers, lookups);
		return CsvExportWriter.write(VOUCHER_LINES_HEADERS, linesRows);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportSingleExcel(Long id) {
		ErpGlVoucher voucher = requireVoucher(id);
		ExportLookups lookups = buildLookups();
		List<ErpGlVoucher> vouchers = List.of(voucher);
		List<List<Object>> vouchersRows = buildVouchersRows(vouchers, lookups);
		List<List<Object>> linesRows = buildLinesRows(vouchers, lookups);

		return ExcelExportWriter.writeSheets(List.of(
				new SheetData("Vouchers", VOUCHERS_HEADERS, vouchersRows),
				new SheetData("Voucher_Lines", VOUCHER_LINES_HEADERS, linesRows)));
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportSingleCsv(Long id) {
		ErpGlVoucher voucher = requireVoucher(id);
		ExportLookups lookups = buildLookups();
		List<List<Object>> linesRows = buildLinesRows(List.of(voucher), lookups);
		return CsvExportWriter.write(VOUCHER_LINES_HEADERS, linesRows);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportPdf(ErpGlVoucherExportRequest request) {
		List<ErpGlVoucher> vouchers = resolveVouchersForExport(request);
		if (vouchers.isEmpty()) {
			throw new BusinessRuleException("No vouchers found to export.");
		}
		ExportLookups lookups = buildLookups();
		List<VoucherPdfWriter.VoucherPdfModel> pdfModels = vouchers.stream()
				.map(v -> toPdfModel(v, lookups))
				.toList();
		return VoucherPdfWriter.write(pdfModels);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportSinglePdf(Long id) {
		ErpGlVoucher voucher = requireVoucher(id);
		ExportLookups lookups = buildLookups();
		return VoucherPdfWriter.write(List.of(toPdfModel(voucher, lookups)));
	}

	public String exportFilename(String ext) {
		return "vouchers-export-" + LocalDate.now(BUSINESS_ZONE).format(EXPORT_DATE_FORMAT) + "." + ext;
	}

	public String exportSingleFilename(Long id, String ext) {
		ErpGlVoucher voucher = requireVoucher(id);
		String num = voucher.getVoucherNumber() != null
				? voucher.getVoucherNumber().replaceAll("[^a-zA-Z0-9.-]", "_")
				: String.valueOf(id);
		return "voucher-" + num + "." + ext;
	}

	private VoucherPdfWriter.VoucherPdfModel toPdfModel(ErpGlVoucher voucher, ExportLookups lookups) {
		ErpLookupItemDto item = lookups.item(voucher.getExternalErpItemId());
		ErpLookupVendorDto vendor = lookups.vendor(voucher.getExternalErpVendorId());
		String itemName = item != null ? item.code() + " - " + item.name() : "-";
		String vendorName = vendor != null ? vendor.code() + " - " + vendor.name() : "-";

		List<ErpGlVoucherEntry> entries = voucher.getEntries();
		BigDecimal debitTotal = entries.stream()
				.map(e -> nonNull(e.getDebit()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal creditTotal = entries.stream()
				.map(e -> nonNull(e.getCredit()))
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		int lineNo = 1;
		List<VoucherPdfWriter.VoucherLinePdfModel> lines = new ArrayList<>();
		for (ErpGlVoucherEntry entry : entries) {
			ErpLookupAccountDto acct = lookups.account(entry.getExternalErpAccountCodeId());
			ErpLookupDepartmentDto dept = lookups.department(entry.getExternalErpDepartmentId());

			lines.add(new VoucherPdfWriter.VoucherLinePdfModel(
					lineNo++,
					acct != null ? acct.code() : "",
					acct != null ? acct.name() : "",
					dept != null ? dept.code() : "-",
					entry.getNote(),
					entry.getInvoiceNo(),
					entry.getDebit(),
					entry.getCredit()));
		}

		String categoryName = voucher.getVoucherCategory() != null ? voucher.getVoucherCategory().name() : "GL";
		String categoryTitle = switch (categoryName) {
			case "APV" -> "ACCOUNTS PAYABLE VOUCHER";
			case "ARV" -> "ACCOUNTS RECEIVABLE VOUCHER";
			case "PV" -> "PAYMENT VOUCHER";
			case "RV" -> "RECEIPT VOUCHER";
			case "JV" -> "GENERAL JOURNAL VOUCHER";
			default -> categoryName + " VOUCHER";
		};

		return new VoucherPdfWriter.VoucherPdfModel(
				voucher.getVoucherNumber(),
				voucher.getErpVoucherNo(),
				categoryName,
				categoryTitle,
				voucher.getVoucherDate(),
				voucher.getTaxMonth(),
				voucher.getWhtMonth(),
				voucher.getStore() != null ? voucher.getStore().getName() : "Laco Invoice",
				voucher.getCurrency(),
				voucher.getStatus() != null ? voucher.getStatus().name() : "GENERATED",
				voucher.getVoucherBrief(),
				voucher.getVoucherDescription(),
				itemName,
				vendorName,
				voucher.getChequeTransferNumber(),
				voucher.getInvoice() != null ? voucher.getInvoice().getInvoiceNumber() : null,
				debitTotal,
				creditTotal,
				lines);
	}

	private List<ErpGlVoucher> resolveVouchersForExport(ErpGlVoucherExportRequest request) {
		if (request == null) {
			throw new BusinessRuleException("Export request is required.");
		}

		List<Long> ids = request.getIds() == null
				? List.of()
				: request.getIds().stream().filter(Objects::nonNull).distinct().toList();

		if (!ids.isEmpty()) {
			if (ids.size() > MAX_EXPORT_ROWS) {
				throw new BusinessRuleException(
						"Export is limited to " + MAX_EXPORT_ROWS + " vouchers. Narrow your selection.");
			}
			List<ErpGlVoucher> list = voucherRepository.findAllById(ids);
			Map<Long, ErpGlVoucher> byId = list.stream()
					.filter(v -> v.getId() != null)
					.collect(Collectors.toMap(ErpGlVoucher::getId, v -> v, (a, b) -> a));
			return ids.stream().map(byId::get).filter(Objects::nonNull).toList();
		}

		if (request.isExportAll()) {
			return SpecQuerySupport.findAll(
					voucherRepository,
					ErpGlVoucher.class,
					request.getFilter(),
					FILTER_FIELD_PATHS,
					MAX_EXPORT_ROWS,
					"Export query matched more than " + MAX_EXPORT_ROWS + " vouchers. Narrow your selection.");
		}

		throw new BusinessRuleException("Specify either voucher IDs or exportAll=true with an optional filter.");
	}

	private List<List<Object>> buildVouchersRows(List<ErpGlVoucher> vouchers, ExportLookups lookups) {
		List<List<Object>> rows = new ArrayList<>(vouchers.size());
		for (ErpGlVoucher voucher : vouchers) {
			List<ErpGlVoucherEntry> entries = voucher.getEntries();
			BigDecimal debitTotal = entries.stream()
					.map(e -> nonNull(e.getDebit()))
					.reduce(BigDecimal.ZERO, BigDecimal::add);
			BigDecimal creditTotal = entries.stream()
					.map(e -> nonNull(e.getCredit()))
					.reduce(BigDecimal.ZERO, BigDecimal::add);

			ErpLookupItemDto item = lookups.item(voucher.getExternalErpItemId());
			ErpLookupVendorDto vendor = lookups.vendor(voucher.getExternalErpVendorId());
			ErpLookupAccountDto account = lookups.account(voucher.getExternalErpAccountCodeId());

			List<Object> row = new ArrayList<>();
			row.add(voucher.getVoucherNumber());
			row.add(voucher.getErpVoucherNo());
			row.add(voucher.getVoucherCategory() != null ? voucher.getVoucherCategory().name() : null);
			row.add(voucher.getVoucherDate());
			row.add(voucher.getTaxMonth());
			row.add(voucher.getWhtMonth());
			row.add(voucher.getStore() != null ? voucher.getStore().getName() : null);
			row.add(voucher.getCurrency());
			row.add(debitTotal);
			row.add(creditTotal);
			row.add(voucher.getStatus() != null ? voucher.getStatus().name() : null);
			row.add(voucher.getVoucherBrief());
			row.add(voucher.getVoucherDescription());
			row.add(voucher.getExternalErpItemId());
			row.add(item != null ? item.code() : null);
			row.add(item != null ? item.name() : null);
			row.add(voucher.getExternalErpVendorId());
			row.add(vendor != null ? vendor.code() : null);
			row.add(vendor != null ? vendor.name() : null);
			row.add(voucher.getExternalErpAccountCodeId());
			row.add(account != null ? account.code() : null);
			row.add(account != null ? account.name() : null);
			row.add(voucher.getChequeTransferNumber());
			row.add(Boolean.TRUE.equals(voucher.getNoTaxInvoice()) ? "Y" : "N");
			row.add(voucher.getRejectRemark());
			row.add(voucher.getInvoice() != null ? voucher.getInvoice().getId() : null);
			row.add(voucher.getInvoice() != null ? voucher.getInvoice().getInvoiceNumber() : null);

			rows.add(row);
		}
		return rows;
	}

	private List<List<Object>> buildLinesRows(List<ErpGlVoucher> vouchers, ExportLookups lookups) {
		List<List<Object>> rows = new ArrayList<>();
		for (ErpGlVoucher voucher : vouchers) {
			List<ErpGlVoucherEntry> entries = voucher.getEntries();
			ErpLookupItemDto voucherItem = lookups.item(voucher.getExternalErpItemId());

			if (entries.isEmpty()) {
				List<Object> row = new ArrayList<>();
				row.add(voucher.getVoucherNumber());
				row.add(1);
				row.add(voucher.getErpVoucherNo());
				row.add(voucher.getVoucherDate());
				row.add(voucher.getVoucherCategory() != null ? voucher.getVoucherCategory().name() : null);
				row.add(null);
				row.add(null);
				row.add(null);
				row.add(BigDecimal.ZERO);
				row.add(BigDecimal.ZERO);
				row.add(voucher.getExternalErpVendorId());
				row.add(null);
				row.add(null);
				row.add(voucher.getExternalErpItemId());
				row.add(voucherItem != null ? voucherItem.code() : null);
				row.add(voucherItem != null ? voucherItem.name() : null);
				row.add(null);
				row.add(null);
				row.add(null);
				row.add(voucher.getCurrency());
				row.add(BigDecimal.ONE);
				row.add(null);
				row.add(null);
				row.add(null);
				row.add(voucher.getStatus() != null ? voucher.getStatus().name() : null);
				rows.add(row);
				continue;
			}

			int lineNo = 1;
			for (ErpGlVoucherEntry entry : entries) {
				ErpLookupAccountDto account = lookups.account(entry.getExternalErpAccountCodeId());
				Long vendorId = entry.getExternalErpVendorId() != null
						? entry.getExternalErpVendorId()
						: voucher.getExternalErpVendorId();
				ErpLookupVendorDto vendor = lookups.vendor(vendorId);
				ErpLookupDepartmentDto dept = lookups.department(entry.getExternalErpDepartmentId());
				ErpLookupCurrencyDto curr = lookups.currency(entry.getExternalErpCurrencyId());

				List<Object> row = new ArrayList<>();
				row.add(voucher.getVoucherNumber());
				row.add(lineNo++);
				row.add(voucher.getErpVoucherNo());
				row.add(voucher.getVoucherDate());
				row.add(voucher.getVoucherCategory() != null ? voucher.getVoucherCategory().name() : null);
				row.add(entry.getExternalErpAccountCodeId());
				row.add(account != null ? account.code() : null);
				row.add(account != null ? account.name() : null);
				row.add(nonNull(entry.getDebit()));
				row.add(nonNull(entry.getCredit()));
				row.add(vendorId);
				row.add(vendor != null ? vendor.code() : null);
				row.add(vendor != null ? vendor.name() : null);
				row.add(voucher.getExternalErpItemId());
				row.add(voucherItem != null ? voucherItem.code() : null);
				row.add(voucherItem != null ? voucherItem.name() : null);
				row.add(entry.getExternalErpDepartmentId());
				row.add(dept != null ? dept.code() : null);
				row.add(dept != null ? dept.name() : null);
				row.add(curr != null ? curr.code() : voucher.getCurrency());
				row.add(entry.getExchangeRate() != null ? entry.getExchangeRate() : BigDecimal.ONE);
				row.add(entry.getInvoiceNo());
				row.add(entry.getInvoiceDate());
				row.add(entry.getNote());
				row.add(voucher.getStatus() != null ? voucher.getStatus().name() : null);

				rows.add(row);
			}
		}
		return rows;
	}

	private class ExportLookups {
		private final Map<Long, ErpLookupAccountDto> accounts = new HashMap<>();
		private final Map<Long, ErpLookupVendorDto> vendors = new HashMap<>();
		private final Map<Long, ErpLookupItemDto> items = new HashMap<>();
		private final Map<Long, ErpLookupDepartmentDto> departments = new HashMap<>();
		private final Map<Long, ErpLookupCurrencyDto> currencies = new HashMap<>();

		public ErpLookupAccountDto account(Long id) {
			if (id == null) return null;
			return accounts.computeIfAbsent(id, k -> erpLookupService.account(k)
					.orElseGet(() -> new ErpLookupAccountDto(k, String.valueOf(k), "Account " + k)));
		}

		public ErpLookupVendorDto vendor(Long id) {
			if (id == null) return null;
			return vendors.computeIfAbsent(id, k -> erpLookupService.vendor(k).orElse(null));
		}

		public ErpLookupItemDto item(Long id) {
			if (id == null) return null;
			return items.computeIfAbsent(id, k -> erpLookupService.item(k).orElse(null));
		}

		public ErpLookupDepartmentDto department(Long id) {
			if (id == null) return null;
			return departments.computeIfAbsent(id, k -> erpLookupService.department(k).orElse(null));
		}

		public ErpLookupCurrencyDto currency(Long id) {
			if (id == null) return null;
			return currencies.computeIfAbsent(id, k -> erpLookupService.currency(k).orElse(null));
		}
	}

	private ExportLookups buildLookups() {
		return new ExportLookups();
	}

	private static String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}
		return value.trim();
	}
}
