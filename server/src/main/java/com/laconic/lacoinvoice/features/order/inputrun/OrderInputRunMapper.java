package com.laconic.lacoinvoice.features.order.inputrun;

import org.springframework.stereotype.Component;

import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.domain.models.OrderInputRun;
import com.laconic.lacoinvoice.domain.models.OrderWithdrawImportRow;

@Component
public class OrderInputRunMapper implements BaseMapper<OrderInputRun, OrderInputRunDto> {

	@Override
	public OrderInputRunDto toDto(OrderInputRun entity) {
		if (entity == null) {
			return null;
		}
		Long storeId = entity.getStore() != null ? entity.getStore().getId() : null;
		String storeName = entity.getStore() != null ? entity.getStore().getName() : null;
		Long marketplaceId = entity.getMarketplace() != null ? entity.getMarketplace().getId() : null;
		String marketplaceCode = entity.getMarketplace() != null ? entity.getMarketplace().getCode() : null;
		Long batchId = entity.getOrderDetailBatch() != null ? entity.getOrderDetailBatch().getId() : null;
		Long importFileId =
				entity.getOrderDetailImportFile() != null ? entity.getOrderDetailImportFile().getId() : null;
		Integer orderCount = entity.getOrderDetailImportFile() != null
				? entity.getOrderDetailImportFile().getImportedOrders()
				: null;
		Integer itemCount = entity.getOrderDetailImportFile() != null
				? entity.getOrderDetailImportFile().getImportedItems()
				: null;
		return new OrderInputRunDto(
				entity.getId(),
				storeId,
				storeName,
				marketplaceId,
				marketplaceCode,
				entity.getTitle(),
				entity.getStatus(),
				entity.getOrderDetailFilename(),
				entity.getOrderDetailSize(),
				entity.getOrderDetailStatus(),
				entity.getOrderDetailError(),
				entity.getOrderDetailStartedAt(),
				entity.getOrderDetailFinishedAt(),
				batchId,
				importFileId,
				entity.getWithdrawFilename(),
				entity.getWithdrawSize(),
				entity.getWithdrawStatus(),
				entity.getWithdrawError(),
				entity.getWithdrawStartedAt(),
				entity.getWithdrawFinishedAt(),
				entity.getWithdrawRowCount(),
				entity.getWithdrawMatchedCount(),
				entity.getWithdrawUnmatchedCount(),
				orderCount,
				itemCount,
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}

	public OrderWithdrawImportRowDto toRowDto(OrderWithdrawImportRow entity) {
		if (entity == null) {
			return null;
		}
		Long orderId = entity.getOrder() != null ? entity.getOrder().getId() : null;
		return new OrderWithdrawImportRowDto(
				entity.getId(),
				entity.getExcelRowIndex(),
				entity.getExternalOrderId(),
				orderId,
				entity.getWithdrawAmount(),
				entity.getCurrency(),
				entity.getWithdrawAt(),
				entity.getPayoutType(),
				entity.getOrderCreatedTime(),
				entity.getOrderSettledTime(),
				entity.getTotalSettlementAmount(),
				entity.getTotalRevenue(),
				entity.getSubtotalAfterSellerDiscounts(),
				entity.getSubtotalBeforeDiscounts(),
				entity.getSellerDiscounts(),
				entity.getRefundSubtotalAfterSellerDiscounts(),
				entity.getRefundSubtotalBeforeSellerDiscounts(),
				entity.getRefundOfSellerDiscounts(),
				entity.getTotalFees(),
				entity.getTransactionFee(),
				entity.getTiktokShopCommissionFee(),
				entity.getCreditCardInstallmentInterest(),
				entity.getSellerShippingFee(),
				entity.getActualShippingFee(),
				entity.getPlatformShippingFeeDiscount(),
				entity.getCustomerShippingFee(),
				entity.getActualReturnShippingFee(),
				entity.getRefundedCustomerShippingFee(),
				entity.getShippingSubsidy(),
				entity.getAffiliateCommission(),
				entity.getAffiliateCommissionBeforePit(),
				entity.getPitWithheldFromAffiliateCommission(),
				entity.getAffiliatePartnerCommission(),
				entity.getAffiliateShopAdsCommission(),
				entity.getAffiliateShopAdsCommissionBeforePit(),
				entity.getPitWithheldFromAffiliateShopAdsCommission(),
				entity.getAffiliateCommissionDeposit(),
				entity.getAffiliateCommissionRefund(),
				entity.getAffiliatePartnerShopAdsCommission(),
				entity.getSfpServiceFee(),
				entity.getBonusCashbackServiceFee(),
				entity.getLiveSpecialsServiceFee(),
				entity.getVoucherXtraServiceFee(),
				entity.getEamsProgramServiceFee(),
				entity.getBrandsCrazyDealsServiceFee(),
				entity.getTiktokPaylaterProgramFee(),
				entity.getCommerceGrowthFee(),
				entity.getInfrastructureFee(),
				entity.getCampaignResourceFee(),
				entity.getPreOrderServiceFee(),
				entity.getAdjustmentAmount(),
				entity.getRelatedOrderId(),
				entity.getCustomerPayment(),
				entity.getCustomerRefund(),
				entity.getSellerCofundedVoucherDiscount(),
				entity.getRefundOfSellerCofundedVoucherDiscount(),
				entity.getPlatformDiscounts(),
				entity.getRefundOfPlatformDiscounts(),
				entity.getPlatformCofundedVoucherDiscounts(),
				entity.getRefundOfPlatformCofundedVoucherDiscounts(),
				entity.getSellerShippingFeeDiscount(),
				entity.getEstimatedPackageWeightG(),
				entity.getActualPackageWeightG(),
				entity.getShoppingCenterItems(),
				entity.getCustomerBankForPayment(),
				entity.getMatchStatus(),
				entity.getApplyStatus(),
				entity.getErrorMessage());
	}
}
