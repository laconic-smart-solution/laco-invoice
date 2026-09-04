package com.laconic.lacoinvoice.features.voucher;

import java.math.BigDecimal;
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
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDetailDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherEntryRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherGenerateRequest;
import com.laconic.lacoinvoice.features.voucher.pageable.ErpGlVoucherPageRequest;

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
	private final ErpLookupService erpLookupService;
	private final ErpPostService erpPostService;
	private final ErpGlVoucherMapper mapper;

	public ErpGlVoucherService(
			ErpGlVoucherRepository voucherRepository,
			ErpGlVoucherEntryRepository entryRepository,
			StoreRepository storeRepository,
			InvoiceRepository invoiceRepository,
			ErpLookupService erpLookupService,
			ErpPostService erpPostService,
			ErpGlVoucherMapper mapper) {
		this.voucherRepository = voucherRepository;
		this.entryRepository = entryRepository;
		this.storeRepository = storeRepository;
		this.invoiceRepository = invoiceRepository;
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
			invoice = invoiceRepository.findById(request.getInvoiceId())
					.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + request.getInvoiceId()));
			if (store == null) {
				store = invoice.getStore();
			}
		}

		ErpGlVoucherCategory category = request.getVoucherCategory();
		String voucherNumber = nextVoucherNumber(category);

		ErpGlVoucher voucher = new ErpGlVoucher();
		applyRequest(voucher, request, store, invoice);
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
			invoice = invoiceRepository.findById(request.getInvoiceId())
					.orElseThrow(() -> new ResourceNotFoundException("Invoice not found: id=" + request.getInvoiceId()));
			if (store == null) {
				store = invoice.getStore();
			}
		}

		applyRequest(voucher, request, store, invoice);
		if (voucher.getStatus() == ErpGlVoucherStatus.FAILED) {
			voucher.setStatus(ErpGlVoucherStatus.GENERATED);
			voucher.setGenerateError(null);
		}
		replaceEntries(voucher, request);
		return mapper.toDto(voucherRepository.save(voucher));
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
			Invoice invoice) {
		voucher.setStore(store);
		voucher.setInvoice(invoice);
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
		erpLookupService.account(request.getExternalErpAccountCodeId())
				.orElseThrow(() -> new IllegalArgumentException(
						"ERP account not found: id=" + request.getExternalErpAccountCodeId()));
		erpLookupService.vendor(request.getExternalErpVendorId())
				.orElseThrow(() -> new IllegalArgumentException(
						"ERP vendor not found: id=" + request.getExternalErpVendorId()));
	}

	private void validateEntries(List<ErpGlVoucherEntryRequest> entries) {
		BigDecimal debitTotal = BigDecimal.ZERO;
		BigDecimal creditTotal = BigDecimal.ZERO;
		for (ErpGlVoucherEntryRequest line : entries) {
			erpLookupService.account(line.getExternalErpAccountCodeId())
					.orElseThrow(() -> new IllegalArgumentException(
							"ERP account not found: id=" + line.getExternalErpAccountCodeId()));
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

	private static String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}
		return value.trim();
	}
}
