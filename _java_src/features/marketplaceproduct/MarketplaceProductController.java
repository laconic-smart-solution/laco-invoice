package com.laconic.lacoinvoice.features.marketplaceproduct;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.marketplaceproduct.pageable.MarketplaceProductPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/marketplace-products")
@Tag(name = "Marketplace products")
public class MarketplaceProductController {

	private static final MediaType XLSX = MediaType.parseMediaType(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

	private final MarketplaceProductService service;
	private final MarketplaceProductSyncService syncService;

	public MarketplaceProductController(
			MarketplaceProductService service,
			MarketplaceProductSyncService syncService) {
		this.service = service;
		this.syncService = syncService;
	}

	@GetMapping("/sources")
	@Operation(summary = "List connected marketplace product sources")
	public ApiResponse<List<MarketplaceProductSourceDto>> listSources() {
		return ApiResponse.ok("OK", service.listSources());
	}

	@GetMapping
	@Operation(summary = "List synced marketplace products from database")
	public ApiResponse<List<MarketplaceProductDto>> listProducts(
			@RequestParam Long storeId,
			@RequestParam String marketplaceCode,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit,
			@RequestParam(required = false) String search,
			@RequestParam(required = false) BigDecimal priceMin,
			@RequestParam(required = false) BigDecimal priceMax,
			@RequestParam(required = false) String erpStatus) {
		MarketplaceProductService.MarketplaceProductPageResult result = service.listProducts(
				storeId,
				marketplaceCode,
				page,
				limit,
				search,
				priceMin,
				priceMax,
				erpStatus);
		return ApiResponse.ok("OK", result.items(), result.meta());
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated marketplace product search")
	public ApiResponse<List<MarketplaceProductDto>> pageable(
			@RequestBody @Valid MarketplaceProductPageRequest request) {
		return service.page(request);
	}

	@PostMapping("/export")
	@Operation(summary = "Export marketplace products to Excel (selected IDs or all matching filter)")
	public ResponseEntity<byte[]> export(@RequestBody MarketplaceProductExportRequest request) {
		byte[] body = service.exportExcel(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename() + "\"")
				.contentType(XLSX)
				.body(body);
	}

	@PostMapping("/export/preview")
	@Operation(summary = "Paginated preview of marketplace products that will be exported")
	public ApiResponse<List<MarketplaceProductDto>> exportPreview(
			@RequestBody MarketplaceProductExportRequest request) {
		return service.exportPreview(request);
	}

	@GetMapping("/stats")
	@Operation(summary = "Marketplace product ERP mapping stats for accessible sources")
	public ApiResponse<MarketplaceProductStatsDto> stats(
			@RequestParam(required = false) Long storeId,
			@RequestParam(required = false) String marketplaceCode) {
		return ApiResponse.ok("OK", service.stats(storeId, marketplaceCode));
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get marketplace product detail by database id")
	public ApiResponse<MarketplaceProductDetailDto> getProductDetail(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getProductDetail(id));
	}

	@PostMapping("/sync")
	@Operation(summary = "Start marketplace product sync job for a store source")
	public ApiResponse<MarketplaceProductSyncRunDto> startSync(
			@RequestParam Long storeId,
			@RequestParam String marketplaceCode) {
		return ApiResponse.ok("Sync started", syncService.startSync(storeId, marketplaceCode));
	}

	@GetMapping("/sync/{syncRunId}")
	@Operation(summary = "Get marketplace product sync job status")
	public ApiResponse<MarketplaceProductSyncRunDto> getSyncStatus(@PathVariable Long syncRunId) {
		return ApiResponse.ok("OK", syncService.getSyncRun(syncRunId));
	}
}
