package com.laconic.lacoinvoice.features.customer;

import java.util.List;

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
}
