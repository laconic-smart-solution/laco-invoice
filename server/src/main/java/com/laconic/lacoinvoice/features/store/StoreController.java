package com.laconic.lacoinvoice.features.store;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.features.store.StoreCommands.CreateRequest;
import com.laconic.lacoinvoice.features.store.StoreCommands.MarketplaceConnectionCreateRequest;
import com.laconic.lacoinvoice.features.store.StoreCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.store.pageable.StorePageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/stores")
@Tag(name = "Stores")
@Validated
public class StoreController {

	private final StoreService service;

	public StoreController(StoreService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(summary = "List stores for current user")
	public ApiResponse<List<StoreDto>> getAll() {
		List<StoreDto> items = service.getAll();
		PageMeta meta = new PageMeta(0, items.size(), items.size(), items.isEmpty() ? 0 : 1);
		return ApiResponse.ok("OK", items, meta);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get store by id")
	public ApiResponse<StoreDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getById(id));
	}

	@PostMapping
	@Operation(summary = "Create store")
	public ResponseEntity<ApiResponse<StoreDto>> create(@RequestBody @Valid CreateRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Created", service.create(request)));
	}

	@PutMapping("/{id}")
	@Operation(summary = "Update store")
	public ApiResponse<StoreDto> update(@PathVariable Long id, @RequestBody @Valid UpdateRequest request) {
		return ApiResponse.ok("Updated", service.update(id, request));
	}

	@DeleteMapping("/{id}")
	@Operation(summary = "Deactivate store")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
		service.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Deleted"));
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated store search")
	public ApiResponse<List<StoreDto>> pageable(@RequestBody @Valid StorePageRequest request) {
		return service.page(request);
	}

	@PostMapping("/{storeId}/marketplace-connections")
	@Operation(summary = "Create marketplace connection for store")
	public ResponseEntity<ApiResponse<StoreMarketplaceConnectionDto>> createMarketplaceConnection(
			@PathVariable Long storeId,
			@RequestBody @Valid MarketplaceConnectionCreateRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.created("Created", service.createMarketplaceConnection(storeId, request)));
	}

	@GetMapping("/{storeId}/marketplace-connections")
	@Operation(summary = "List marketplace connections for store")
	public ApiResponse<List<StoreMarketplaceConnectionDto>> listMarketplaceConnections(@PathVariable Long storeId) {
		List<StoreMarketplaceConnectionDto> items = service.listMarketplaceConnections(storeId);
		PageMeta meta = new PageMeta(0, items.size(), items.size(), items.isEmpty() ? 0 : 1);
		return ApiResponse.ok("OK", items, meta);
	}
}
