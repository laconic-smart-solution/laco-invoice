package com.laconic.lacoinvoice.features.purchaseorder;

import java.util.List;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.purchaseorder.PurchaseOrderCommands.CreateRequest;
import com.laconic.lacoinvoice.features.purchaseorder.PurchaseOrderCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.purchaseorder.pageable.PurchaseOrderPageRequest;

public interface PurchaseOrderService extends BaseService<PurchaseOrderDto, CreateRequest, UpdateRequest> {

	ApiResponse<List<PurchaseOrderDto>> page(PurchaseOrderPageRequest request);
}
