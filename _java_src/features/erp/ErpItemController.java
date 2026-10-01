package com.laconic.lacoinvoice.features.erp;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.BaseCrudController;
import com.laconic.lacoinvoice.features.erp.ErpItemCommands.CreateRequest;
import com.laconic.lacoinvoice.features.erp.ErpItemCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.erp.pageable.ErpItemPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/erp-items")
@Tag(name = "ERP Items")
public class ErpItemController extends BaseCrudController<ErpItemDto, CreateRequest, UpdateRequest> {

	private final ErpItemService service;

	public ErpItemController(ErpItemService service) {
		this.service = service;
	}

	@Override
	protected BaseService<ErpItemDto, CreateRequest, UpdateRequest> service() {
		return service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated ERP item search")
	public ApiResponse<List<ErpItemDto>> pageable(@RequestBody @Valid ErpItemPageRequest request) {
		return service.page(request);
	}
}
