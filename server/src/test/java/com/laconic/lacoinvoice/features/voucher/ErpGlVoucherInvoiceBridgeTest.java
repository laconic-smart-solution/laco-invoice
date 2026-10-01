package com.laconic.lacoinvoice.features.voucher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucher;
import com.laconic.lacoinvoice.domain.models.ErpGlVoucherCategory;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.ErpGlVoucherEntryRepository;
import com.laconic.lacoinvoice.domain.repositories.ErpGlVoucherRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderInputRunRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.erp.ErpPostService;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupAccountDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupCurrencyDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupDepartmentDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupItemDto;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupService;
import com.laconic.lacoinvoice.features.erp.lookup.ErpLookupVendorDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherEntryRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherGenerateRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherInvoicePreviewRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherPreviewDto;

@ExtendWith(MockitoExtension.class)
class ErpGlVoucherInvoiceBridgeTest {

	@Mock
	private ErpGlVoucherRepository voucherRepository;
	@Mock
	private ErpGlVoucherEntryRepository entryRepository;
	@Mock
	private StoreRepository storeRepository;
	@Mock
	private InvoiceRepository invoiceRepository;
	@Mock
	private OrderInputRunRepository orderInputRunRepository;
	@Mock
	private ErpLookupService erpLookupService;
	@Mock
	private ErpPostService erpPostService;
	@Mock
	private ErpGlVoucherMapper mapper;

	@InjectMocks
	private ErpGlVoucherService service;

	@Test
	void previewFromInvoiceBuildsBalancedDebitAndCredit() {
		Invoice invoice = invoice();
		when(invoiceRepository.findById(9L)).thenReturn(Optional.of(invoice));
		when(erpLookupService.item(1L)).thenReturn(Optional.of(new ErpLookupItemDto(1L, "ITEM", "Item")));
		when(erpLookupService.itemFinanceAccounts(1L)).thenReturn(List.of());
		when(erpLookupService.account(10L)).thenReturn(Optional.of(new ErpLookupAccountDto(10L, "AR", "Receivable")));
		when(erpLookupService.account(20L)).thenReturn(Optional.of(new ErpLookupAccountDto(20L, "REV", "Revenue")));
		when(erpLookupService.vendor(3L)).thenReturn(Optional.of(new ErpLookupVendorDto(3L, "V1", "Vendor")));
		when(erpLookupService.department(4L)).thenReturn(Optional.of(new ErpLookupDepartmentDto(4L, "D1", "Dept")));
		when(erpLookupService.currency(5L)).thenReturn(Optional.of(new ErpLookupCurrencyDto(5L, "THB", "Baht")));

		ErpGlVoucherInvoicePreviewRequest request = new ErpGlVoucherInvoicePreviewRequest();
		request.setInvoiceId(9L);
		request.setExternalErpItemId(1L);
		request.setDebitAccountId(10L);
		request.setCreditAccountId(20L);
		request.setExternalErpVendorId(3L);
		request.setExternalErpDepartmentId(4L);
		request.setExternalErpCurrencyId(5L);

		ErpGlVoucherPreviewDto preview = service.previewFromInvoice(request);

		assertThat(preview.invoiceId()).isEqualTo(9L);
		assertThat(preview.invoiceNumber()).isEqualTo("INV-9");
		assertThat(preview.debitTotal()).isEqualByComparingTo("107.00");
		assertThat(preview.creditTotal()).isEqualByComparingTo("107.00");
		assertThat(preview.entries()).hasSize(2);
		assertThat(preview.entries().get(0).getDebit()).isEqualByComparingTo("107.00");
		assertThat(preview.entries().get(0).getCredit()).isEqualByComparingTo("0");
		assertThat(preview.entries().get(1).getDebit()).isEqualByComparingTo("0");
		assertThat(preview.entries().get(1).getCredit()).isEqualByComparingTo("107.00");
		assertThat(preview.entries().get(0).getInvoiceNo()).isEqualTo("INV-9");
	}

	@Test
	void generateRejectsDuplicateInvoiceVoucherUnlessForced() {
		when(erpLookupService.item(1L)).thenReturn(Optional.of(new ErpLookupItemDto(1L, "ITEM", "Item")));
		when(erpLookupService.account(10L)).thenReturn(Optional.of(new ErpLookupAccountDto(10L, "AR", "Receivable")));
		when(erpLookupService.account(20L)).thenReturn(Optional.of(new ErpLookupAccountDto(20L, "REV", "Revenue")));
		when(erpLookupService.vendor(3L)).thenReturn(Optional.of(new ErpLookupVendorDto(3L, "V1", "Vendor")));
		when(erpLookupService.currency(5L)).thenReturn(Optional.of(new ErpLookupCurrencyDto(5L, "THB", "Baht")));
		when(voucherRepository.existsByInvoice_Id(9L)).thenReturn(true);

		ErpGlVoucherGenerateRequest request = generateRequest();
		request.setAllowDuplicate(false);

		assertThatThrownBy(() -> service.generate(request))
				.isInstanceOf(BusinessRuleException.class)
				.hasMessageContaining("already exists");
	}

	@Test
	void getByInvoiceIdRequiresExistingInvoice() {
		when(invoiceRepository.existsById(9L)).thenReturn(false);

		assertThatThrownBy(() -> service.getByInvoiceId(9L))
				.isInstanceOf(ResourceNotFoundException.class)
				.hasMessageContaining("Invoice not found");
	}

	@Test
	void getByInvoiceIdReturnsMappedVouchers() {
		ErpGlVoucher voucher = new ErpGlVoucher();
		ErpGlVoucherDto dto = voucherDto();
		when(invoiceRepository.existsById(9L)).thenReturn(true);
		when(voucherRepository.findByInvoice_IdOrderByIdDesc(9L)).thenReturn(List.of(voucher));
		when(mapper.toDto(voucher)).thenReturn(dto);

		assertThat(service.getByInvoiceId(9L)).containsExactly(dto);
	}

	private static Invoice invoice() {
		Store store = new Store();
		store.setId(1L);
		store.setName("Store");
		Invoice invoice = new Invoice();
		invoice.setId(9L);
		invoice.setInvoiceNumber("INV-9");
		invoice.setTitle("Manual invoice");
		invoice.setGrandTotal(new BigDecimal("107.00"));
		invoice.setCurrency("THB");
		invoice.setEndDate(LocalDate.of(2026, 9, 22));
		invoice.setStore(store);
		return invoice;
	}

	private static ErpGlVoucherGenerateRequest generateRequest() {
		ErpGlVoucherEntryRequest debit = new ErpGlVoucherEntryRequest();
		debit.setExternalErpAccountCodeId(10L);
		debit.setDebit(new BigDecimal("107.00"));
		debit.setCredit(BigDecimal.ZERO);
		debit.setExternalErpCurrencyId(5L);
		ErpGlVoucherEntryRequest credit = new ErpGlVoucherEntryRequest();
		credit.setExternalErpAccountCodeId(20L);
		credit.setDebit(BigDecimal.ZERO);
		credit.setCredit(new BigDecimal("107.00"));
		credit.setExternalErpCurrencyId(5L);
		ErpGlVoucherGenerateRequest request = new ErpGlVoucherGenerateRequest();
		request.setInvoiceId(9L);
		request.setVoucherCategory(ErpGlVoucherCategory.JV);
		request.setVoucherDate(LocalDate.of(2026, 9, 22));
		request.setVoucherBrief("Invoice: INV-9");
		request.setExternalErpItemId(1L);
		request.setExternalErpAccountCodeId(20L);
		request.setExternalErpVendorId(3L);
		request.setEntries(List.of(debit, credit));
		return request;
	}

	private static ErpGlVoucherDto voucherDto() {
		return new ErpGlVoucherDto(
				1L, "JV-1", null, "JV-1", ErpGlVoucherCategory.JV, LocalDate.of(2026, 9, 22),
				null, null, "THB", null, "Invoice: INV-9", null, false, null, null,
				1L, "Store", 9L, "INV-9", null, null, 1L, 20L, 3L,
				new BigDecimal("107.00"), new BigDecimal("107.00"), null, null, null);
	}
}
