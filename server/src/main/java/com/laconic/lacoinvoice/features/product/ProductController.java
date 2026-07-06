package com.laconic.lacoinvoice.features.product;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.BaseCrudController;
import com.laconic.lacoinvoice.features.product.ProductCommands.CreateRequest;
import com.laconic.lacoinvoice.features.product.ProductCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.product.pageable.ProductPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products")
public class ProductController extends BaseCrudController<ProductDto, CreateRequest, UpdateRequest> {

	private final ProductService service;

	public ProductController(ProductService service) {
		this.service = service;
	}

	@Override
	protected BaseService<ProductDto, CreateRequest, UpdateRequest> service() {
		return service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated product search")
	public ApiResponse<List<ProductDto>> pageable(@RequestBody @Valid ProductPageRequest request) {
		return service.page(request);
	}
}
