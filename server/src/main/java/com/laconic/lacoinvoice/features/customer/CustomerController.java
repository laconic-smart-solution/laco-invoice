package com.laconic.lacoinvoice.features.customer;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.BaseCrudController;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.CreateRequest;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.customer.pageable.CustomerPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/customers")
@Tag(name = "Customers")
public class CustomerController extends BaseCrudController<CustomerDto, CreateRequest, UpdateRequest> {

	private static final MediaType XLSX = MediaType.parseMediaType(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

	private final CustomerService service;

	public CustomerController(CustomerService service) {
		this.service = service;
	}

	@Override
	protected BaseService<CustomerDto, CreateRequest, UpdateRequest> service() {
		return service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated customer search")
	public ApiResponse<List<CustomerDto>> pageable(@RequestBody @Valid CustomerPageRequest request) {
		return service.page(request);
	}

	@PostMapping("/export")
	@Operation(summary = "Export customers to Excel (selected IDs or all matching filter)")
	public ResponseEntity<byte[]> export(@RequestBody CustomerExportRequest request) {
		byte[] body = service.exportExcel(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename() + "\"")
				.contentType(XLSX)
				.body(body);
	}

	@PostMapping("/export/preview")
	@Operation(summary = "Paginated preview of customers that will be exported")
	public ApiResponse<List<CustomerDto>> exportPreview(@RequestBody CustomerExportRequest request) {
		return service.exportPreview(request);
	}
}
