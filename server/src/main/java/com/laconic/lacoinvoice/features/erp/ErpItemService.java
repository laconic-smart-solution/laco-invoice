package com.laconic.lacoinvoice.features.erp;

import java.util.List;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.erp.ErpItemCommands.CreateRequest;
import com.laconic.lacoinvoice.features.erp.ErpItemCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.erp.pageable.ErpItemPageRequest;

public interface ErpItemService extends BaseService<ErpItemDto, CreateRequest, UpdateRequest> {

	ApiResponse<List<ErpItemDto>> page(ErpItemPageRequest request);

	void createProductMapping(Long productId, ErpMappingRequest request);

	void deleteProductMapping(Long productId, Long mappingId);
}
