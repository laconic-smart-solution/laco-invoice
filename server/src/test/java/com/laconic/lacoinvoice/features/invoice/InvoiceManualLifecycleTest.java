package com.laconic.lacoinvoice.features.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.domain.models.Invoice;
import com.laconic.lacoinvoice.domain.models.InvoiceSourceType;
import com.laconic.lacoinvoice.domain.models.InvoiceStatus;
import com.laconic.lacoinvoice.domain.repositories.ErpGlVoucherRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceItemRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceOrderRepository;
import com.laconic.lacoinvoice.domain.repositories.InvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderInputRunRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderTaxInvoiceRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.invoice.dto.InvoiceDto;

@ExtendWith(MockitoExtension.class)
class InvoiceManualLifecycleTest {

	@Mock
	private InvoiceRepository invoiceRepository;
	@Mock
	private InvoiceOrderRepository invoiceOrderRepository;
	@Mock
	private InvoiceItemRepository invoiceItemRepository;
	@Mock
	private OrderRepository orderRepository;
	@Mock
	private OrderTaxInvoiceRepository orderTaxInvoiceRepository;
	@Mock
	private OrderInputRunRepository orderInputRunRepository;
	@Mock
	private StoreRepository storeRepository;
	@Mock
	private MarketplaceRepository marketplaceRepository;
	@Mock
	private ErpGlVoucherRepository voucherRepository;
	@Mock
	private InvoiceMapper mapper;

	@InjectMocks
	private InvoiceService service;

	@Test
	void issueRequiresAtLeastOneLine() {
		Invoice invoice = manualDraft(BigDecimal.TEN);
		when(invoiceRepository.findById(9L)).thenReturn(Optional.of(invoice));
		when(invoiceItemRepository.countByInvoice_Id(9L)).thenReturn(0L);

		assertThatThrownBy(() -> service.updateStatus(9L, InvoiceStatus.ISSUED))
				.isInstanceOf(BusinessRuleException.class)
				.hasMessageContaining("at least one line");
	}

	@Test
	void issueRequiresNonzeroTotal() {
		Invoice invoice = manualDraft(BigDecimal.ZERO);
		when(invoiceRepository.findById(9L)).thenReturn(Optional.of(invoice));
		when(invoiceItemRepository.countByInvoice_Id(9L)).thenReturn(1L);

		assertThatThrownBy(() -> service.updateStatus(9L, InvoiceStatus.ISSUED))
				.isInstanceOf(BusinessRuleException.class)
				.hasMessageContaining("nonzero");
	}

	@Test
	void issueMarksManualDraftAsIssued() {
		Invoice invoice = manualDraft(new BigDecimal("24.96"));
		InvoiceDto dto = invoiceDto();
		when(invoiceRepository.findById(9L)).thenReturn(Optional.of(invoice));
		when(invoiceItemRepository.countByInvoice_Id(9L)).thenReturn(2L);
		when(invoiceRepository.save(invoice)).thenReturn(invoice);
		when(mapper.toDto(invoice)).thenReturn(dto);

		InvoiceDto result = service.updateStatus(9L, InvoiceStatus.ISSUED);

		assertThat(result).isSameAs(dto);
		assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.ISSUED);
		assertThat(invoice.getIssuedAt()).isNotNull();
		verify(invoiceRepository).save(invoice);
	}

	@Test
	void deleteIsBlockedWhenAVoucherExists() {
		Invoice invoice = manualDraft(BigDecimal.TEN);
		when(invoiceRepository.findById(9L)).thenReturn(Optional.of(invoice));
		when(voucherRepository.existsByInvoice_Id(9L)).thenReturn(true);

		assertThatThrownBy(() -> service.delete(9L))
				.isInstanceOf(BusinessRuleException.class)
				.hasMessageContaining("linked to a voucher");
	}

	@Test
	void deleteSoftDeletesDraftWithoutVoucher() {
		Invoice invoice = manualDraft(BigDecimal.TEN);
		when(invoiceRepository.findById(9L)).thenReturn(Optional.of(invoice));
		when(voucherRepository.existsByInvoice_Id(9L)).thenReturn(false);
		when(invoiceItemRepository.findByInvoice_IdOrderByOrderDateAscIdAsc(9L)).thenReturn(List.of());
		when(invoiceOrderRepository.findByInvoice_IdOrderByOrderDateAscIdAsc(9L)).thenReturn(List.of());
		when(invoiceRepository.save(invoice)).thenReturn(invoice);

		service.delete(9L);

		verify(invoiceRepository).save(invoice);
	}

	private static Invoice manualDraft(BigDecimal grandTotal) {
		Invoice invoice = new Invoice();
		invoice.setSourceType(InvoiceSourceType.MANUAL);
		invoice.setStatus(InvoiceStatus.DRAFT);
		invoice.setGrandTotal(grandTotal);
		return invoice;
	}

	private static InvoiceDto invoiceDto() {
		return new InvoiceDto(
				9L, "INV-9", "Manual", 1L, "Store", 1L, "TIKTOK",
				InvoiceSourceType.MANUAL, InvoiceStatus.ISSUED, null, null, null, null,
				0, 1, BigDecimal.TEN, new BigDecimal("0.07"), BigDecimal.ONE, new BigDecimal("11.00"),
				"THB", null, null, null, null, null, null, null, null);
	}
}
