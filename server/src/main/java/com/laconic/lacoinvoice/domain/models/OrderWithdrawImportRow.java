package com.laconic.lacoinvoice.domain.models;

import java.math.BigDecimal;
import java.time.Instant;

import com.laconic.lacoinvoice.common.persistence.MasterEntity;

import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * One row from TikTok Payout Report sheet "Order details"
 * (see docs/tiktok-payout-report.md). Every Excel column has a DB column.
 */
@Getter
@Setter
@Entity
@Table(name = "order_withdraw_import_rows")
public class OrderWithdrawImportRow extends MasterEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_input_run_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private OrderInputRun orderInputRun;

	@Column(name = "excel_row_index")
	private Integer excelRowIndex;

	/** Order/adjustment ID — used to match {@link Order#getExternalOrderId()}. */
	@Column(name = "external_order_id", length = 100)
	private String externalOrderId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
	private Order order;

	/** Alias of total settlement amount for apply/match helpers. */
	@Column(name = "withdraw_amount", precision = 18, scale = 2)
	private BigDecimal withdrawAmount;

	@Column(name = "currency", length = 10)
	private String currency;

	/** Alias of order settled time. */
	@Column(name = "withdraw_at")
	private Instant withdrawAt;

	// --- Excel: Order details (typed columns) ---

	@Column(name = "payout_type", length = 50)
	private String payoutType;

	@Column(name = "order_created_time")
	private Instant orderCreatedTime;

	@Column(name = "order_settled_time")
	private Instant orderSettledTime;

	@Column(name = "total_settlement_amount", precision = 18, scale = 2)
	private BigDecimal totalSettlementAmount;

	@Column(name = "total_revenue", precision = 18, scale = 2)
	private BigDecimal totalRevenue;

	@Column(name = "subtotal_after_seller_disc", precision = 18, scale = 2)
	private BigDecimal subtotalAfterSellerDiscounts;

	@Column(name = "subtotal_before_discounts", precision = 18, scale = 2)
	private BigDecimal subtotalBeforeDiscounts;

	@Column(name = "seller_discounts", precision = 18, scale = 2)
	private BigDecimal sellerDiscounts;

	@Column(name = "refund_subtotal_after_seller", precision = 18, scale = 2)
	private BigDecimal refundSubtotalAfterSellerDiscounts;

	@Column(name = "refund_subtotal_before_seller", precision = 18, scale = 2)
	private BigDecimal refundSubtotalBeforeSellerDiscounts;

	@Column(name = "refund_of_seller_discounts", precision = 18, scale = 2)
	private BigDecimal refundOfSellerDiscounts;

	@Column(name = "total_fees", precision = 18, scale = 2)
	private BigDecimal totalFees;

	@Column(name = "transaction_fee", precision = 18, scale = 2)
	private BigDecimal transactionFee;

	@Column(name = "tiktok_shop_commission_fee", precision = 18, scale = 2)
	private BigDecimal tiktokShopCommissionFee;

	@Column(name = "cc_installment_interest", precision = 18, scale = 2)
	private BigDecimal creditCardInstallmentInterest;

	@Column(name = "seller_shipping_fee", precision = 18, scale = 2)
	private BigDecimal sellerShippingFee;

	@Column(name = "actual_shipping_fee", precision = 18, scale = 2)
	private BigDecimal actualShippingFee;

	@Column(name = "platform_shipping_fee_disc", precision = 18, scale = 2)
	private BigDecimal platformShippingFeeDiscount;

	@Column(name = "customer_shipping_fee", precision = 18, scale = 2)
	private BigDecimal customerShippingFee;

	@Column(name = "actual_return_shipping_fee", precision = 18, scale = 2)
	private BigDecimal actualReturnShippingFee;

	@Column(name = "refunded_customer_ship_fee", precision = 18, scale = 2)
	private BigDecimal refundedCustomerShippingFee;

	@Column(name = "shipping_subsidy", precision = 18, scale = 2)
	private BigDecimal shippingSubsidy;

	@Column(name = "affiliate_commission", precision = 18, scale = 2)
	private BigDecimal affiliateCommission;

	@Column(name = "affiliate_comm_before_pit", precision = 18, scale = 2)
	private BigDecimal affiliateCommissionBeforePit;

	@Column(name = "pit_withheld_affiliate_comm", precision = 18, scale = 2)
	private BigDecimal pitWithheldFromAffiliateCommission;

	@Column(name = "affiliate_partner_commission", precision = 18, scale = 2)
	private BigDecimal affiliatePartnerCommission;

	@Column(name = "affiliate_shop_ads_comm", precision = 18, scale = 2)
	private BigDecimal affiliateShopAdsCommission;

	@Column(name = "aff_shop_ads_comm_before_pit", precision = 18, scale = 2)
	private BigDecimal affiliateShopAdsCommissionBeforePit;

	@Column(name = "pit_withheld_aff_shop_ads", precision = 18, scale = 2)
	private BigDecimal pitWithheldFromAffiliateShopAdsCommission;

	@Column(name = "affiliate_commission_deposit", precision = 18, scale = 2)
	private BigDecimal affiliateCommissionDeposit;

	@Column(name = "affiliate_commission_refund", precision = 18, scale = 2)
	private BigDecimal affiliateCommissionRefund;

	@Column(name = "aff_partner_shop_ads_comm", precision = 18, scale = 2)
	private BigDecimal affiliatePartnerShopAdsCommission;

	@Column(name = "sfp_service_fee", precision = 18, scale = 2)
	private BigDecimal sfpServiceFee;

	@Column(name = "bonus_cashback_service_fee", precision = 18, scale = 2)
	private BigDecimal bonusCashbackServiceFee;

	@Column(name = "live_specials_service_fee", precision = 18, scale = 2)
	private BigDecimal liveSpecialsServiceFee;

	@Column(name = "voucher_xtra_service_fee", precision = 18, scale = 2)
	private BigDecimal voucherXtraServiceFee;

	@Column(name = "eams_program_service_fee", precision = 18, scale = 2)
	private BigDecimal eamsProgramServiceFee;

	@Column(name = "brands_crazy_deals_svc_fee", precision = 18, scale = 2)
	private BigDecimal brandsCrazyDealsServiceFee;

	@Column(name = "tiktok_paylater_program_fee", precision = 18, scale = 2)
	private BigDecimal tiktokPaylaterProgramFee;

	@Column(name = "commerce_growth_fee", precision = 18, scale = 2)
	private BigDecimal commerceGrowthFee;

	@Column(name = "infrastructure_fee", precision = 18, scale = 2)
	private BigDecimal infrastructureFee;

	@Column(name = "campaign_resource_fee", precision = 18, scale = 2)
	private BigDecimal campaignResourceFee;

	@Column(name = "pre_order_service_fee", precision = 18, scale = 2)
	private BigDecimal preOrderServiceFee;

	@Column(name = "adjustment_amount", precision = 18, scale = 2)
	private BigDecimal adjustmentAmount;

	@Column(name = "related_order_id", length = 100)
	private String relatedOrderId;

	@Column(name = "customer_payment", precision = 18, scale = 2)
	private BigDecimal customerPayment;

	@Column(name = "customer_refund", precision = 18, scale = 2)
	private BigDecimal customerRefund;

	@Column(name = "seller_cofunded_voucher_disc", precision = 18, scale = 2)
	private BigDecimal sellerCofundedVoucherDiscount;

	@Column(name = "refund_seller_cofunded_voucher", precision = 18, scale = 2)
	private BigDecimal refundOfSellerCofundedVoucherDiscount;

	@Column(name = "platform_discounts", precision = 18, scale = 2)
	private BigDecimal platformDiscounts;

	@Column(name = "refund_of_platform_discounts", precision = 18, scale = 2)
	private BigDecimal refundOfPlatformDiscounts;

	@Column(name = "platform_cofunded_voucher_disc", precision = 18, scale = 2)
	private BigDecimal platformCofundedVoucherDiscounts;

	@Column(name = "refund_plat_cofunded_voucher", precision = 18, scale = 2)
	private BigDecimal refundOfPlatformCofundedVoucherDiscounts;

	@Column(name = "seller_shipping_fee_discount", precision = 18, scale = 2)
	private BigDecimal sellerShippingFeeDiscount;

	@Column(name = "estimated_package_weight_g", precision = 18, scale = 4)
	private BigDecimal estimatedPackageWeightG;

	@Column(name = "actual_package_weight_g", precision = 18, scale = 4)
	private BigDecimal actualPackageWeightG;

	@Lob
	@Column(name = "shopping_center_items")
	private String shoppingCenterItems;

	@Column(name = "customer_bank_for_payment", length = 200)
	private String customerBankForPayment;

	@Enumerated(EnumType.STRING)
	@Column(name = "match_status", nullable = false, length = 20)
	private OrderWithdrawMatchStatus matchStatus = OrderWithdrawMatchStatus.INVALID;

	@Enumerated(EnumType.STRING)
	@Column(name = "apply_status", nullable = false, length = 20)
	private OrderWithdrawApplyStatus applyStatus = OrderWithdrawApplyStatus.PENDING;

	@Column(name = "error_message", length = 1000)
	private String errorMessage;
}
