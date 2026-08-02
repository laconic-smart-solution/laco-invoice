package com.laconic.lacoinvoice.features.invoice;

import java.util.List;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.invoice.pageable.InvoicePageRequest;

public interface InvoiceService {

	InvoiceDto generateForOrder(Long orderId);

	InvoiceDetailDto getDetailById(Long id);

	ApiResponse<List<InvoiceListItemDto>> page(InvoicePageRequest request);

	InvoiceStatsDto stats(Long storeId);

	InvoiceDto voidInvoice(Long id);

	byte[] renderPdf(Long id);

	String pdfFilename(Long id);

	byte[] exportExcel(InvoiceExportRequest request);

	String exportFilename();

	ApiResponse<List<InvoiceListItemDto>> exportPreview(InvoiceExportRequest request);

	byte[] bulkPdfZip(InvoiceExportRequest request);

	String bulkPdfZipFilename();

	/**
	 * Generate invoices for selected/matching orders (skip if already invoiced)
	 * and return their PDFs as a ZIP archive.
	 */
	byte[] bulkGenerateZip(com.laconic.lacoinvoice.features.order.OrderExportRequest request);

	String bulkGenerateZipFilename();
}
