package com.laconic.lacoinvoice.features.invoice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.laconic.lacoinvoice.domain.models.Invoice;

/**
 * Stub PDF renderer — real HTML-to-PDF (e.g. ChromeDP) integration deferred.
 */
@Service
public class InvoicePdfService {

	private static final Logger log = LoggerFactory.getLogger(InvoicePdfService.class);

	public String renderAndStore(Invoice invoice) {
		String url = "/api/v1/invoices/" + invoice.getId() + "/pdf";
		log.info("PDF stub generated for invoiceNo={} url={}", invoice.getInvoiceNo(), url);
		return url;
	}
}
