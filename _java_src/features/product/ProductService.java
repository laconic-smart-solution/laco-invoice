package com.laconic.lacoinvoice.features.product;

import java.util.List;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.product.ProductCommands.CreateRequest;
import com.laconic.lacoinvoice.features.product.ProductCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.product.pageable.ProductPageRequest;

public interface ProductService extends BaseService<ProductDto, CreateRequest, UpdateRequest> {

	ApiResponse<List<ProductDto>> page(ProductPageRequest request);
}
