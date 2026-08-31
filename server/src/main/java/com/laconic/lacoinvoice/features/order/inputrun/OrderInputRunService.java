package com.laconic.lacoinvoice.features.order.inputrun;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderImportBatch;
import com.laconic.lacoinvoice.domain.models.OrderImportBatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;
import com.laconic.lacoinvoice.domain.models.OrderImportStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputFileStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputRun;
import com.laconic.lacoinvoice.domain.models.OrderInputRunStatus;
import com.laconic.lacoinvoice.domain.models.OrderWithdrawApplyStatus;
import com.laconic.lacoinvoice.domain.models.OrderWithdrawImportRow;
import com.laconic.lacoinvoice.domain.models.OrderWithdrawMatchStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportBatchRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportFileRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderInputRunRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderWithdrawImportRowRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.features.order.import_.OrderImportPreviewBatchDto;
import com.laconic.lacoinvoice.features.order.import_.OrderImportPreviewService;
import com.laconic.lacoinvoice.features.order.import_.OrderImportResultDto;
import com.laconic.lacoinvoice.features.order.inputrun.ParsedWithdrawWorkbook.ParsedWithdrawRow;
import com.laconic.lacoinvoice.features.order.inputrun.pageable.OrderInputRunPageRequest;

@Service
public class OrderInputRunService {

	private static final Logger log = LoggerFactory.getLogger(OrderInputRunService.class);

	private static final Map<String, String> FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"marketplaceId", "marketplace.id",
			"marketplaceCode", "marketplace.code",
			"title", "title",
			"status", "status");

	private final OrderInputRunRepository runRepository;
	private final OrderWithdrawImportRowRepository withdrawRowRepository;
	private final StoreRepository storeRepository;
	private final MarketplaceRepository marketplaceRepository;
	private final OrderRepository orderRepository;
	private final OrderImportFileRepository importFileRepository;
	private final OrderImportBatchRepository importBatchRepository;
	private final OrderImportPreviewService orderImportPreviewService;
	private final OrderWithdrawExcelParser withdrawExcelParser;
	private final OrderInputRunMapper mapper;
	private final JdbcTemplate jdbcTemplate;

	public OrderInputRunService(
			OrderInputRunRepository runRepository,
			OrderWithdrawImportRowRepository withdrawRowRepository,
			StoreRepository storeRepository,
			MarketplaceRepository marketplaceRepository,
			OrderRepository orderRepository,
			OrderImportFileRepository importFileRepository,
			OrderImportBatchRepository importBatchRepository,
			OrderImportPreviewService orderImportPreviewService,
			OrderWithdrawExcelParser withdrawExcelParser,
			OrderInputRunMapper mapper,
			JdbcTemplate jdbcTemplate) {
		this.runRepository = runRepository;
		this.withdrawRowRepository = withdrawRowRepository;
		this.storeRepository = storeRepository;
		this.marketplaceRepository = marketplaceRepository;
		this.orderRepository = orderRepository;
		this.importFileRepository = importFileRepository;
		this.importBatchRepository = importBatchRepository;
		this.orderImportPreviewService = orderImportPreviewService;
		this.withdrawExcelParser = withdrawExcelParser;
		this.mapper = mapper;
		this.jdbcTemplate = jdbcTemplate;
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<OrderInputRunDto>> page(OrderInputRunPageRequest request) {
		return PageQuerySupport.query(
				runRepository,
				mapper,
				request.toPageAndFilter(),
				OrderInputRun.class,
				request.getFilter(),
				FILTER_FIELD_PATHS);
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto getById(Long id) {
		return mapper.toDto(requireRun(id));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto updateTitle(Long id, String title) {
		OrderInputRun run = requireRun(id);
		if (StringUtils.hasText(title)) {
			run.setTitle(title.trim());
		}
		return mapper.toDto(runRepository.save(run));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto create(OrderInputRunCreateRequest request) {
		Store store = storeRepository.findById(request.getStoreId())
				.orElseThrow(() -> new IllegalArgumentException("Store not found: id=" + request.getStoreId()));
		Marketplace marketplace = marketplaceRepository.findByCodeIgnoreCase(request.getMarketplaceCode())
				.orElseThrow(() -> new IllegalArgumentException(
						"Marketplace not found: code=" + request.getMarketplaceCode()));

		OrderInputRun run = new OrderInputRun();
		run.setStore(store);
		run.setMarketplace(marketplace);
		run.setTitle(request.getTitle().trim());
		run.setStatus(OrderInputRunStatus.DRAFT);
		run.setOrderDetailStatus(OrderInputFileStatus.MISSING);
		run.setWithdrawStatus(OrderInputFileStatus.MISSING);
		return mapper.toDto(runRepository.save(run));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto uploadOrderDetail(Long id, MultipartFile file) {
		OrderInputRun run = requireRun(id);
		assertNotRunning(run);
		byte[] content = readBytes(file);
		run.setOrderDetailFilename(safeFilename(file));
		run.setOrderDetailContent(content);
		run.setOrderDetailSize((long) content.length);
		run.setOrderDetailStatus(OrderInputFileStatus.READY);
		run.setOrderDetailError(null);
		run.setOrderDetailStartedAt(null);
		run.setOrderDetailFinishedAt(null);
		run.setOrderDetailBatch(null);
		run.setOrderDetailImportFile(null);
		run.setStatus(OrderInputRunStatus.DRAFT);
		return mapper.toDto(runRepository.save(run));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto uploadWithdraw(Long id, MultipartFile file) {
		OrderInputRun run = requireRun(id);
		assertNotRunning(run);
		byte[] content = readBytes(file);
		run.setWithdrawFilename(safeFilename(file));
		run.setWithdrawContent(content);
		run.setWithdrawSize((long) content.length);
		run.setWithdrawStatus(OrderInputFileStatus.READY);
		run.setWithdrawError(null);
		run.setWithdrawStartedAt(null);
		run.setWithdrawFinishedAt(null);
		run.setWithdrawRowCount(null);
		run.setWithdrawMatchedCount(null);
		run.setWithdrawUnmatchedCount(null);
		run.setStatus(OrderInputRunStatus.DRAFT);
		return mapper.toDto(runRepository.save(run));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderImportPreviewBatchDto startRunPreview(Long id) {
		OrderInputRun run = requireRun(id);
		assertNotRunning(run);

		boolean orderReady = isRunnable(run.getOrderDetailStatus()) && run.getOrderDetailContent() != null;
		if (!orderReady) {
			throw new IllegalArgumentException(
					"Order Detail Excel must be uploaded (READY) before running");
		}

		run.setStatus(OrderInputRunStatus.RUNNING);
		run.setOrderDetailStatus(OrderInputFileStatus.RUNNING);
		run.setOrderDetailStartedAt(Instant.now());
		run.setOrderDetailError(null);
		run.setOrderDetailFinishedAt(null);
		run.setOrderDetailImportFile(null);
		runRepository.save(run);

		try {
			OrderImportPreviewBatchDto preview = orderImportPreviewService.preview(
					run.getStore().getId(),
					run.getMarketplace().getCode(),
					run.getOrderDetailFilename(),
					run.getOrderDetailContent());

			OrderImportBatch batch = importBatchRepository.findById(preview.getBatchId())
					.orElseThrow(() -> new IllegalStateException(
							"Preview batch not found: id=" + preview.getBatchId()));
			run.setOrderDetailBatch(batch);
			runRepository.save(run);
			return preview;
		} catch (Exception ex) {
			log.error("Order detail preview failed for inputRunId={}", run.getId(), ex);
			run.setOrderDetailStatus(OrderInputFileStatus.FAILED);
			run.setOrderDetailError(ex.getMessage());
			run.setOrderDetailFinishedAt(Instant.now());
			recomputeOverallStatus(run);
			runRepository.save(run);
			throw ex instanceof RuntimeException runtime ? runtime : new IllegalStateException(ex);
		}
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto cancelRunPreview(Long id) {
		return resetStuckRunning(id);
	}

	/**
	 * Clears abandoned RUNNING state (e.g. user refreshed while import preview was open).
	 * Order-detail preview â†’ back to READY; stuck withdraw RUNNING â†’ back to READY.
	 */
	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto resetStuckRunning(Long id) {
		OrderInputRun run = requireRun(id);
		boolean changed = false;

		if (run.getOrderDetailStatus() == OrderInputFileStatus.RUNNING) {
			OrderImportBatch batch = run.getOrderDetailBatch();
			if (batch != null && batch.getStatus() == OrderImportBatchStatus.PREVIEW) {
				batch.setStatus(OrderImportBatchStatus.CANCELLED);
			}
			run.setOrderDetailBatch(null);
			run.setOrderDetailStatus(
					run.getOrderDetailContent() != null
							? OrderInputFileStatus.READY
							: OrderInputFileStatus.MISSING);
			run.setOrderDetailError(null);
			run.setOrderDetailStartedAt(null);
			run.setOrderDetailFinishedAt(null);
			changed = true;
		}

		if (run.getWithdrawStatus() == OrderInputFileStatus.RUNNING) {
			run.setWithdrawStatus(
					run.getWithdrawContent() != null
							? OrderInputFileStatus.READY
							: OrderInputFileStatus.MISSING);
			run.setWithdrawError(null);
			run.setWithdrawStartedAt(null);
			run.setWithdrawFinishedAt(null);
			changed = true;
		}

		if (run.getStatus() == OrderInputRunStatus.RUNNING || changed) {
			recomputeOverallStatus(run);
			changed = true;
		}

		return changed ? mapper.toDto(runRepository.save(run)) : mapper.toDto(run);
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto finishRunAfterOrderDetail(Long id, OrderImportResultDto importResult) {
		OrderInputRun run = requireRun(id);
		if (run.getOrderDetailStatus() != OrderInputFileStatus.RUNNING) {
			throw new IllegalArgumentException("Order detail is not awaiting commit for this run");
		}

		if (importResult.getImportFileId() != null) {
			OrderImportFile importFile = importFileRepository.findById(importResult.getImportFileId()).orElse(null);
			run.setOrderDetailImportFile(importFile);
		}

		if (importResult.getStatus() == OrderImportStatus.FAILED) {
			run.setOrderDetailStatus(OrderInputFileStatus.FAILED);
			run.setOrderDetailError(String.join("; ", importResult.getErrors()));
		} else if (importResult.getStatus() == OrderImportStatus.PARTIAL) {
			run.setOrderDetailStatus(OrderInputFileStatus.PARTIAL);
			run.setOrderDetailError(
					importResult.getErrors() == null || importResult.getErrors().isEmpty()
							? null
							: String.join("; ", importResult.getErrors()));
		} else {
			run.setOrderDetailStatus(OrderInputFileStatus.SUCCEEDED);
			run.setOrderDetailError(null);
			run.setOrderDetailContent(null);
		}
		run.setOrderDetailFinishedAt(Instant.now());
		recomputeOverallStatus(run);
		return mapper.toDto(runRepository.save(run));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto runWithdrawFile(Long id) {
		OrderInputRun run = requireRun(id);
		assertNotRunning(run);

		boolean withdrawReady = isRunnable(run.getWithdrawStatus()) && run.getWithdrawContent() != null;
		if (!withdrawReady) {
			throw new IllegalArgumentException(
					"Total Withdraw Excel must be uploaded (READY) before running");
		}

		run.setStatus(OrderInputRunStatus.RUNNING);
		runRepository.save(run);
		runWithdraw(run);
		recomputeOverallStatus(run);
		return mapper.toDto(runRepository.save(run));
	}

	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<OrderWithdrawImportRowDto>> pageWithdrawRows(
			Long id,
			int pageNumber,
			int pageSize,
			String externalOrderId,
			String matchStatus,
			String applyStatus,
			String sortBy,
			String sortOrder) {
		requireRun(id);
		int safePage = Math.max(pageNumber, 1);
		int safeSize = Math.min(Math.max(pageSize, 1), 500);
		String orderIdFilter = StringUtils.hasText(externalOrderId) ? externalOrderId.trim() : null;
		OrderWithdrawMatchStatus matchFilter = parseMatchStatus(matchStatus);
		OrderWithdrawApplyStatus applyFilter = parseApplyStatus(applyStatus);
		Page<OrderWithdrawImportRow> page = withdrawRowRepository.findFilteredByRunId(
				id,
				orderIdFilter,
				matchFilter,
				applyFilter,
				PageRequest.of(safePage - 1, safeSize, resolveWithdrawSort(sortBy, sortOrder)));
		List<OrderWithdrawImportRowDto> data = page.getContent().stream().map(mapper::toRowDto).toList();
		PageMeta meta = new PageMeta(safePage, safeSize, page.getTotalElements(), page.getTotalPages());
		return ApiResponse.ok("OK", data, meta);
	}

	private static Sort resolveWithdrawSort(String sortBy, String sortOrder) {
		String field = switch (sortBy == null ? "" : sortBy.trim()) {
			case "externalOrderId" -> "externalOrderId";
			case "withdrawAmount", "totalSettlementAmount" -> "withdrawAmount";
			case "totalFees" -> "totalFees";
			case "totalAdjustments", "adjustmentAmount" -> "adjustmentAmount";
			case "matchStatus" -> "matchStatus";
			case "applyStatus" -> "applyStatus";
			default -> "excelRowIndex";
		};
		Sort.Direction direction = "DESC".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
		return Sort.by(direction, field).and(Sort.by(Sort.Direction.ASC, "id"));
	}

	private static OrderWithdrawMatchStatus parseMatchStatus(String value) {
		if (!StringUtils.hasText(value) || "all".equalsIgnoreCase(value.trim())) {
			return null;
		}
		try {
			return OrderWithdrawMatchStatus.valueOf(value.trim().toUpperCase());
		} catch (IllegalArgumentException ex) {
			return null;
		}
	}

	private static OrderWithdrawApplyStatus parseApplyStatus(String value) {
		if (!StringUtils.hasText(value) || "all".equalsIgnoreCase(value.trim())) {
			return null;
		}
		try {
			return OrderWithdrawApplyStatus.valueOf(value.trim().toUpperCase());
		} catch (IllegalArgumentException ex) {
			return null;
		}
	}

	private void runWithdraw(OrderInputRun run) {
		run.setWithdrawStatus(OrderInputFileStatus.RUNNING);
		run.setWithdrawStartedAt(Instant.now());
		run.setWithdrawError(null);
		runRepository.save(run);

		try {
			withdrawRowRepository.deleteByOrderInputRunId(run.getId());
			withdrawRowRepository.flush();

			ParsedWithdrawWorkbook workbook = withdrawExcelParser.parse(run.getWithdrawContent());
			Long storeId = run.getStore().getId();
			Long marketplaceId = run.getMarketplace().getId();

			int matched = 0;
			int unmatched = 0;
			int invalid = 0;
			int failed = 0;

			for (ParsedWithdrawRow parsed : workbook.rows()) {
				OrderWithdrawImportRow row = mapParsedRow(run, parsed);

				if (!StringUtils.hasText(parsed.orderAdjustmentId())) {
					row.setMatchStatus(OrderWithdrawMatchStatus.INVALID);
					row.setApplyStatus(OrderWithdrawApplyStatus.SKIPPED);
					row.setErrorMessage("Missing Order/adjustment ID");
					invalid++;
				} else {
					var orderOpt = orderRepository.findByStore_IdAndMarketplace_IdAndExternalOrderId(
							storeId, marketplaceId, parsed.orderAdjustmentId().trim());
					if (orderOpt.isPresent()) {
						Order order = orderOpt.get();
						row.setOrder(order);
						row.setMatchStatus(OrderWithdrawMatchStatus.MATCHED);
						row.setApplyStatus(OrderWithdrawApplyStatus.APPLIED);
						matched++;
					} else {
						row.setMatchStatus(OrderWithdrawMatchStatus.UNMATCHED);
						row.setApplyStatus(OrderWithdrawApplyStatus.SKIPPED);
						row.setErrorMessage("No matching order in store for this marketplace");
						unmatched++;
					}
				}
				try {
					withdrawRowRepository.save(row);
				} catch (Exception ex) {
					failed++;
					row.setApplyStatus(OrderWithdrawApplyStatus.FAILED);
					row.setErrorMessage(ex.getMessage());
					withdrawRowRepository.save(row);
				}
			}

			run.setWithdrawRowCount(workbook.rowCount());
			run.setWithdrawMatchedCount(matched);
			run.setWithdrawUnmatchedCount(unmatched + invalid);

			if (workbook.rowCount() == 0) {
				run.setWithdrawStatus(OrderInputFileStatus.FAILED);
				run.setWithdrawError("No withdraw/settlement rows found in Excel");
			} else if (failed > 0 && matched == 0) {
				run.setWithdrawStatus(OrderInputFileStatus.FAILED);
				run.setWithdrawError("Failed to save withdraw rows");
			} else if (failed > 0 || unmatched > 0 || invalid > 0) {
				run.setWithdrawStatus(OrderInputFileStatus.PARTIAL);
			} else {
				run.setWithdrawStatus(OrderInputFileStatus.SUCCEEDED);
			}

			if (run.getWithdrawStatus() == OrderInputFileStatus.SUCCEEDED) {
				run.setWithdrawContent(null);
			}
		} catch (Exception ex) {
			log.error("Withdraw run failed for inputRunId={}", run.getId(), ex);
			run.setWithdrawStatus(OrderInputFileStatus.FAILED);
			run.setWithdrawError(ex.getMessage());
		} finally {
			run.setWithdrawFinishedAt(Instant.now());
			runRepository.save(run);
		}
	}

	private void recomputeOverallStatus(OrderInputRun run) {
		OrderInputFileStatus od = run.getOrderDetailStatus();
		OrderInputFileStatus wd = run.getWithdrawStatus();

		if (od == OrderInputFileStatus.RUNNING || wd == OrderInputFileStatus.RUNNING) {
			run.setStatus(OrderInputRunStatus.RUNNING);
			return;
		}
		boolean odOk = od == OrderInputFileStatus.SUCCEEDED;
		boolean wdOk = wd == OrderInputFileStatus.SUCCEEDED;
		boolean odBad = od == OrderInputFileStatus.FAILED || od == OrderInputFileStatus.PARTIAL;
		boolean wdBad = wd == OrderInputFileStatus.FAILED || wd == OrderInputFileStatus.PARTIAL;

		if (odOk && wdOk) {
			run.setStatus(OrderInputRunStatus.COMPLETED);
		} else if (od == OrderInputFileStatus.FAILED && wd == OrderInputFileStatus.FAILED) {
			run.setStatus(OrderInputRunStatus.FAILED);
		} else if (odBad || wdBad) {
			run.setStatus(OrderInputRunStatus.PARTIAL);
		} else {
			run.setStatus(OrderInputRunStatus.DRAFT);
		}
	}

	private static OrderWithdrawImportRow mapParsedRow(OrderInputRun run, ParsedWithdrawRow parsed) {
		OrderWithdrawImportRow row = new OrderWithdrawImportRow();
		row.setOrderInputRun(run);
		row.setExcelRowIndex(parsed.excelRowIndex());
		row.setExternalOrderId(parsed.orderAdjustmentId());
		row.setCurrency(parsed.currency());
		row.setWithdrawAmount(parsed.totalSettlementAmount());
		row.setWithdrawAt(parsed.orderSettledTime());
		row.setPayoutType(parsed.payoutType());
		row.setOrderCreatedTime(parsed.orderCreatedTime());
		row.setOrderSettledTime(parsed.orderSettledTime());
		row.setTotalSettlementAmount(parsed.totalSettlementAmount());
		row.setTotalRevenue(parsed.totalRevenue());
		row.setSubtotalAfterSellerDiscounts(parsed.subtotalAfterSellerDiscounts());
		row.setSubtotalBeforeDiscounts(parsed.subtotalBeforeDiscounts());
		row.setSellerDiscounts(parsed.sellerDiscounts());
		row.setRefundSubtotalAfterSellerDiscounts(parsed.refundSubtotalAfterSellerDiscounts());
		row.setRefundSubtotalBeforeSellerDiscounts(parsed.refundSubtotalBeforeSellerDiscounts());
		row.setRefundOfSellerDiscounts(parsed.refundOfSellerDiscounts());
		row.setTotalFees(parsed.totalFees());
		row.setTransactionFee(parsed.transactionFee());
		row.setTiktokShopCommissionFee(parsed.tiktokShopCommissionFee());
		row.setCreditCardInstallmentInterest(parsed.creditCardInstallmentInterest());
		row.setSellerShippingFee(parsed.sellerShippingFee());
		row.setActualShippingFee(parsed.actualShippingFee());
		row.setPlatformShippingFeeDiscount(parsed.platformShippingFeeDiscount());
		row.setCustomerShippingFee(parsed.customerShippingFee());
		row.setActualReturnShippingFee(parsed.actualReturnShippingFee());
		row.setRefundedCustomerShippingFee(parsed.refundedCustomerShippingFee());
		row.setShippingSubsidy(parsed.shippingSubsidy());
		row.setAffiliateCommission(parsed.affiliateCommission());
		row.setAffiliateCommissionBeforePit(parsed.affiliateCommissionBeforePit());
		row.setPitWithheldFromAffiliateCommission(parsed.pitWithheldFromAffiliateCommission());
		row.setAffiliatePartnerCommission(parsed.affiliatePartnerCommission());
		row.setAffiliateShopAdsCommission(parsed.affiliateShopAdsCommission());
		row.setAffiliateShopAdsCommissionBeforePit(parsed.affiliateShopAdsCommissionBeforePit());
		row.setPitWithheldFromAffiliateShopAdsCommission(parsed.pitWithheldFromAffiliateShopAdsCommission());
		row.setAffiliateCommissionDeposit(parsed.affiliateCommissionDeposit());
		row.setAffiliateCommissionRefund(parsed.affiliateCommissionRefund());
		row.setAffiliatePartnerShopAdsCommission(parsed.affiliatePartnerShopAdsCommission());
		row.setSfpServiceFee(parsed.sfpServiceFee());
		row.setBonusCashbackServiceFee(parsed.bonusCashbackServiceFee());
		row.setLiveSpecialsServiceFee(parsed.liveSpecialsServiceFee());
		row.setVoucherXtraServiceFee(parsed.voucherXtraServiceFee());
		row.setEamsProgramServiceFee(parsed.eamsProgramServiceFee());
		row.setBrandsCrazyDealsServiceFee(parsed.brandsCrazyDealsServiceFee());
		row.setTiktokPaylaterProgramFee(parsed.tiktokPaylaterProgramFee());
		row.setCommerceGrowthFee(parsed.commerceGrowthFee());
		row.setInfrastructureFee(parsed.infrastructureFee());
		row.setCampaignResourceFee(parsed.campaignResourceFee());
		row.setPreOrderServiceFee(parsed.preOrderServiceFee());
		row.setAdjustmentAmount(parsed.adjustmentAmount());
		row.setRelatedOrderId(parsed.relatedOrderId());
		row.setCustomerPayment(parsed.customerPayment());
		row.setCustomerRefund(parsed.customerRefund());
		row.setSellerCofundedVoucherDiscount(parsed.sellerCofundedVoucherDiscount());
		row.setRefundOfSellerCofundedVoucherDiscount(parsed.refundOfSellerCofundedVoucherDiscount());
		row.setPlatformDiscounts(parsed.platformDiscounts());
		row.setRefundOfPlatformDiscounts(parsed.refundOfPlatformDiscounts());
		row.setPlatformCofundedVoucherDiscounts(parsed.platformCofundedVoucherDiscounts());
		row.setRefundOfPlatformCofundedVoucherDiscounts(parsed.refundOfPlatformCofundedVoucherDiscounts());
		row.setSellerShippingFeeDiscount(parsed.sellerShippingFeeDiscount());
		row.setEstimatedPackageWeightG(parsed.estimatedPackageWeightG());
		row.setActualPackageWeightG(parsed.actualPackageWeightG());
		row.setShoppingCenterItems(parsed.shoppingCenterItems());
		row.setCustomerBankForPayment(parsed.customerBankForPayment());
		return row;
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void deleteSet(Long id) {
		OrderInputRun run = requireRun(id);
		assertNotRunning(run);

		log.info("Cascading complete deletion for order input run id={}", id);

		Long importFileId = run.getOrderDetailImportFile() != null ? run.getOrderDetailImportFile().getId() : null;
		Long batchId = run.getOrderDetailBatch() != null ? run.getOrderDetailBatch().getId() : null;

		// 1. Delete preview items (temp table)
		if (batchId != null) {
			jdbcTemplate.update("""
					DELETE FROM order_import_preview_items
					WHERE preview_order_id IN (
						SELECT id FROM order_import_preview_orders WHERE batch_id = ?
					)
					""", batchId);
			jdbcTemplate.update("DELETE FROM order_import_preview_orders WHERE batch_id = ?", batchId);
			jdbcTemplate.update("DELETE FROM order_import_batches WHERE id = ?", batchId);
		}

		if (importFileId != null) {
			// Delete preview items & orders for batches committed to this file
			jdbcTemplate.update("""
					DELETE FROM order_import_preview_items
					WHERE preview_order_id IN (
						SELECT po.id FROM order_import_preview_orders po
						JOIN order_import_batches b ON po.batch_id = b.id
						WHERE b.committed_import_file_id = ?
					)
					""", importFileId);
			jdbcTemplate.update("""
					DELETE FROM order_import_preview_orders
					WHERE batch_id IN (
						SELECT id FROM order_import_batches WHERE committed_import_file_id = ?
					)
					""", importFileId);
			jdbcTemplate.update("DELETE FROM order_import_batches WHERE committed_import_file_id = ?", importFileId);

			// Delete history changes
			jdbcTemplate.update("""
					DELETE FROM order_history_changes
					WHERE history_id IN (
						SELECT oh.id FROM order_history oh
						JOIN lco_orders o ON oh.order_id = o.id
						WHERE o.source_type = 'IMPORT' AND o.source_id = ?
					)
					""", importFileId);

			// Delete history
			jdbcTemplate.update("""
					DELETE FROM order_history
					WHERE order_id IN (
						SELECT id FROM lco_orders WHERE source_type = 'IMPORT' AND source_id = ?
					)
					""", importFileId);

			// Delete tax invoices
			jdbcTemplate.update("""
					DELETE FROM order_tax_invoices
					WHERE order_id IN (
						SELECT id FROM lco_orders WHERE source_type = 'IMPORT' AND source_id = ?
					)
					""", importFileId);

			// Delete order items
			jdbcTemplate.update("""
					DELETE FROM order_items
					WHERE order_id IN (
						SELECT id FROM lco_orders WHERE source_type = 'IMPORT' AND source_id = ?
					)
					""", importFileId);

			// Delete orders
			jdbcTemplate.update(
					"DELETE FROM lco_orders WHERE source_type = 'IMPORT' AND source_id = ?",
					importFileId);
		}

		// 2. Delete withdraw settlement rows (temp table)
		jdbcTemplate.update("DELETE FROM order_withdraw_import_rows WHERE order_input_run_id = ?", id);

		// 3. Unlink references on order_input_runs before file deletion
		jdbcTemplate.update(
				"UPDATE order_input_runs SET order_detail_batch_id = NULL, order_detail_import_file_id = NULL WHERE id = ?",
				id);

		// 4. Delete import file record if existed
		if (importFileId != null) {
			jdbcTemplate.update("DELETE FROM order_import_files WHERE id = ?", importFileId);
		}

		// 5. Delete orphan customers that no longer belong to any order
		jdbcTemplate.update("""
				DELETE FROM customers_info
				WHERE id NOT IN (
					SELECT DISTINCT customer_id FROM lco_orders WHERE customer_id IS NOT NULL
				)
				""");

		// 6. Delete orphan products that are no longer referenced in any order item
		jdbcTemplate.update("""
				DELETE FROM products
				WHERE id NOT IN (
					SELECT DISTINCT product_id FROM order_items WHERE product_id IS NOT NULL
				)
				""");

		// 7. Delete the order input run itself
		jdbcTemplate.update("DELETE FROM order_input_runs WHERE id = ?", id);
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto rollbackOrderDetail(Long id) {
		OrderInputRun run = requireRun(id);
		assertNotRunning(run);

		OrderImportFile importFile = run.getOrderDetailImportFile();
		if (importFile != null) {
			Long importFileId = importFile.getId();
			log.info("Rolling back order detail import file id={} for run id={}", importFileId, id);

			// 1. Bulk delete history changes using single indexed subquery
			jdbcTemplate.update(
					"""
					DELETE FROM order_history_changes
					WHERE history_id IN (
						SELECT oh.id FROM order_history oh
						JOIN lco_orders o ON oh.order_id = o.id
						WHERE o.source_type = 'IMPORT' AND o.source_id = ?
					)
					""",
					importFileId);

			// 2. Bulk delete history events
			jdbcTemplate.update(
					"""
					DELETE FROM order_history
					WHERE order_id IN (
						SELECT o.id FROM lco_orders o
						WHERE o.source_type = 'IMPORT' AND o.source_id = ?
					)
					""",
					importFileId);

			// 3. Bulk delete order items
			jdbcTemplate.update(
					"""
					DELETE FROM order_items
					WHERE order_id IN (
						SELECT o.id FROM lco_orders o
						WHERE o.source_type = 'IMPORT' AND o.source_id = ?
					)
					""",
					importFileId);

			// 4. Bulk delete orders
			jdbcTemplate.update(
					"DELETE FROM lco_orders WHERE source_type = 'IMPORT' AND source_id = ?",
					importFileId);

			// 5. Delete import file record
			run.setOrderDetailImportFile(null);
			run.setOrderDetailBatch(null);
			jdbcTemplate.update("DELETE FROM order_import_files WHERE id = ?", importFileId);
		}

		run.setOrderDetailFilename(null);
		run.setOrderDetailContent(null);
		run.setOrderDetailSize(null);
		run.setOrderDetailStatus(OrderInputFileStatus.MISSING);
		run.setOrderDetailError(null);
		run.setOrderDetailStartedAt(null);
		run.setOrderDetailFinishedAt(null);

		if (run.getWithdrawStatus() == OrderInputFileStatus.MISSING) {
			run.setStatus(OrderInputRunStatus.DRAFT);
		} else if (run.getWithdrawStatus() == OrderInputFileStatus.SUCCEEDED) {
			run.setStatus(OrderInputRunStatus.COMPLETED);
		} else {
			run.setStatus(OrderInputRunStatus.PARTIAL);
		}

		return mapper.toDto(runRepository.save(run));
	}

	@Loggable
	@Transactional
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public OrderInputRunDto rollbackWithdraw(Long id) {
		OrderInputRun run = requireRun(id);
		assertNotRunning(run);

		log.info("Rolling back withdraw settlement rows for run id={}", id);

		// Fast direct bulk delete via JdbcTemplate
		jdbcTemplate.update("DELETE FROM order_withdraw_import_rows WHERE order_input_run_id = ?", id);

		run.setWithdrawFilename(null);
		run.setWithdrawContent(null);
		run.setWithdrawSize(null);
		run.setWithdrawStatus(OrderInputFileStatus.MISSING);
		run.setWithdrawError(null);
		run.setWithdrawStartedAt(null);
		run.setWithdrawFinishedAt(null);
		run.setWithdrawRowCount(null);
		run.setWithdrawMatchedCount(null);
		run.setWithdrawUnmatchedCount(null);

		if (run.getOrderDetailStatus() == OrderInputFileStatus.MISSING) {
			run.setStatus(OrderInputRunStatus.DRAFT);
		} else if (run.getOrderDetailStatus() == OrderInputFileStatus.SUCCEEDED) {
			run.setStatus(OrderInputRunStatus.COMPLETED);
		} else {
			run.setStatus(OrderInputRunStatus.PARTIAL);
		}

		return mapper.toDto(runRepository.save(run));
	}



	private OrderInputRun requireRun(Long id) {
		return runRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order input run not found: id=" + id));
	}

	private static void assertNotRunning(OrderInputRun run) {
		if (run.getStatus() == OrderInputRunStatus.RUNNING
				|| run.getOrderDetailStatus() == OrderInputFileStatus.RUNNING
				|| run.getWithdrawStatus() == OrderInputFileStatus.RUNNING) {
			throw new IllegalStateException("Order input run is already RUNNING");
		}
	}

	private static boolean isRunnable(OrderInputFileStatus status) {
		return status == OrderInputFileStatus.READY
				|| status == OrderInputFileStatus.FAILED
				|| status == OrderInputFileStatus.PARTIAL
				|| status == OrderInputFileStatus.SUCCEEDED;
	}

	private static byte[] readBytes(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Excel file is required");
		}
		try {
			return file.getBytes();
		} catch (Exception ex) {
			throw new IllegalArgumentException("Failed to read upload: " + ex.getMessage(), ex);
		}
	}

	private static String safeFilename(MultipartFile file) {
		String name = file.getOriginalFilename();
		return StringUtils.hasText(name) ? name : "upload.xlsx";
	}
}

