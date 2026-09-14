package com.laconic.lacoinvoice.features.voucher;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDetailDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherExportRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherGenerateRequest;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherPreviewDto;
import com.laconic.lacoinvoice.features.voucher.dto.ErpGlVoucherPreviewRequest;
import com.laconic.lacoinvoice.features.voucher.pageable.ErpGlVoucherPageRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/vouchers")
@Tag(name = "Vouchers")
public class ErpGlVoucherController {

	private static final MediaType XLSX =
			MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	private static final MediaType CSV =
			MediaType.parseMediaType("text/csv; charset=UTF-8");

	private final ErpGlVoucherService service;

	public ErpGlVoucherController(ErpGlVoucherService service) {
		this.service = service;
	}

	@PostMapping("/pageable")
	@Operation(summary = "Paginated voucher search")
	public ApiResponse<List<ErpGlVoucherDto>> pageable(@RequestBody @Valid ErpGlVoucherPageRequest request) {
		return service.page(request);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get voucher header and entry lines (ERP IDs only)")
	public ApiResponse<ErpGlVoucherDetailDto> getById(@PathVariable Long id) {
		return ApiResponse.ok("OK", service.getById(id));
	}

	@PostMapping("/preview-from-order-input")
	@Operation(summary = "Preview auto-generated voucher header and balanced entries from Order Data Input and ERP item Finance Info")
	public ApiResponse<ErpGlVoucherPreviewDto> previewFromOrderInput(
			@RequestBody @Valid ErpGlVoucherPreviewRequest request) {
		return ApiResponse.ok("OK", service.previewFromOrderInput(request));
	}

	@GetMapping("/by-order-input-run/{runId}")
	@Operation(summary = "Get vouchers associated with an Order Data Input run")
	public ApiResponse<List<ErpGlVoucherDto>> getByOrderInputRun(@PathVariable Long runId) {
		return ApiResponse.ok("OK", service.getByOrderInputRunId(runId));
	}

	@PostMapping
	@Operation(summary = "Generate a GL voucher. Persists ERP IDs only; labels stay in ERP.")
	public ApiResponse<ErpGlVoucherDto> generate(@RequestBody @Valid ErpGlVoucherGenerateRequest request) {
		return ApiResponse.ok("Created", service.generate(request));
	}

	@PutMapping("/{id}")
	@Operation(summary = "Update a voucher that has not been posted to ERP")
	public ApiResponse<ErpGlVoucherDto> update(
			@PathVariable Long id,
			@RequestBody @Valid ErpGlVoucherGenerateRequest request) {
		return ApiResponse.ok("Updated", service.update(id, request));
	}

	@PostMapping("/{id}/post")
	@Operation(summary = "Post a generated voucher to ERP (stubbed until live ERP is wired)")
	public ApiResponse<ErpGlVoucherDto> postToErp(@PathVariable Long id) {
		return ApiResponse.ok("Posted", service.postToErp(id));
	}

	@PostMapping("/export/excel")
	@Operation(summary = "Export GL vouchers to Excel (.xlsx)")
	public ResponseEntity<byte[]> exportExcel(@RequestBody ErpGlVoucherExportRequest request) {
		byte[] body = service.exportExcel(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename("xlsx") + "\"")
				.contentType(XLSX)
				.body(body);
	}

	@PostMapping("/export/csv")
	@Operation(summary = "Export GL vouchers to CSV (.csv)")
	public ResponseEntity<byte[]> exportCsv(@RequestBody ErpGlVoucherExportRequest request) {
		byte[] body = service.exportCsv(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename("csv") + "\"")
				.contentType(CSV)
				.body(body);
	}

	@GetMapping("/{id}/export/excel")
	@Operation(summary = "Export a single GL voucher to Excel (.xlsx)")
	public ResponseEntity<byte[]> exportSingleExcel(@PathVariable Long id) {
		byte[] body = service.exportSingleExcel(id);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportSingleFilename(id, "xlsx") + "\"")
				.contentType(XLSX)
				.body(body);
	}

	@GetMapping("/{id}/export/csv")
	@Operation(summary = "Export a single GL voucher to CSV (.csv)")
	public ResponseEntity<byte[]> exportSingleCsv(@PathVariable Long id) {
		byte[] body = service.exportSingleCsv(id);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportSingleFilename(id, "csv") + "\"")
				.contentType(CSV)
				.body(body);
	}

	@PostMapping("/export/pdf")
	@Operation(summary = "Export GL vouchers to PDF (.pdf)")
	public ResponseEntity<byte[]> exportPdf(@RequestBody ErpGlVoucherExportRequest request) {
		byte[] body = service.exportPdf(request);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportFilename("pdf") + "\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(body);
	}

	@GetMapping("/{id}/export/pdf")
	@Operation(summary = "Export a single GL voucher to PDF (.pdf)")
	public ResponseEntity<byte[]> exportSinglePdf(@PathVariable Long id) {
		byte[] body = service.exportSinglePdf(id);
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + service.exportSingleFilename(id, "pdf") + "\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(body);
	}
}

