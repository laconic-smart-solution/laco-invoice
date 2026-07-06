package com.laconic.lacoinvoice.features.purchaseorder;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.BaseCrudController;
import com.laconic.lacoinvoice.features.purchaseorder.PurchaseOrderCommands.CreateRequest;
import com.laconic.lacoinvoice.features.purchaseorder.PurchaseOrderCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.purchaseorder.pageable.PurchaseOrderPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@Tag(name = "Purchase Orders")
public class PurchaseOrderController extends BaseCrudController<PurchaseOrderDto, CreateRequest, UpdateRequest> {

	private final PurchaseOrderService service;

	public PurchaseOrderController(PurchaseOrderService service) {
		this.service = service;
	}

	@Override
	protected BaseService<PurchaseOrderDto, CreateRequest, UpdateRequest> service() {
		return service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated purchase order search")
	public ApiResponse<List<PurchaseOrderDto>> pageable(@RequestBody @Valid PurchaseOrderPageRequest request) {
		return service.page(request);
	}
}
