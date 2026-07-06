package com.laconic.lacoinvoice.features.invoice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order Invoices")
public class OrderInvoiceController {

	private final InvoiceService invoiceService;

	public OrderInvoiceController(InvoiceService invoiceService) {
		this.invoiceService = invoiceService;
	}

	@PostMapping("/{orderId}/invoices")
	@Operation(summary = "Generate invoice for order")
	public ResponseEntity<ApiResponse<InvoiceDto>> generateInvoice(@PathVariable Long orderId) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Invoice generated", invoiceService.generateForOrder(orderId)));
	}
}
