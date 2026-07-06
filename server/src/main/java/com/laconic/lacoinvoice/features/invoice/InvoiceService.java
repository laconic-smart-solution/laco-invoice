package com.laconic.lacoinvoice.features.invoice;

import java.util.List;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.invoice.pageable.InvoicePageRequest;

public interface InvoiceService {

	InvoiceDto generateForOrder(Long orderId);

	InvoiceDetailDto getDetailById(Long id);

	ApiResponse<List<InvoiceListItemDto>> page(InvoicePageRequest request);

	InvoiceDto voidInvoice(Long id);

	String getPdfUrl(Long id);
}
