package com.laconic.lacoinvoice.features.order.import_;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.beans.BeanUtils;
import org.springframework.util.StringUtils;

/**
 * JSON-serializable snapshot of Excel order header fields (line items stored separately).
 */
public class OrderImportHeaderSnapshot {

	private String orderStatus;
	private String orderSubstatus;
	private String cancelReturnType;
	private String orderKind;
	private BigDecimal shippingFeeAfterDiscount;
	private BigDecimal shippingFeeOriginal;
	private BigDecimal shippingFeeSellerDisc;
	private BigDecimal shippingFeePlatformDisc;
	private BigDecimal paymentPlatformDiscount;
	private BigDecimal taxes;
	private BigDecimal totalAmount;
	private BigDecimal refundAmount;
	private Instant orderDate;
	private Instant paidAt;
	private Instant rtsAt;
	private Instant shippedAt;
	private Instant deliveredAt;
	private Instant cancelledAt;
	private String cancelBy;
	private String cancelReason;
	private String fulfillmentType;
	private String warehouseName;
	private String trackingId;
	private String deliveryOption;
	private String shippingProviderName;
	private String buyerMessage;
	private String buyerUsername;
	private String recipient;
	private String phone;
	private String zipcode;
	private String country;
	private String province;
	private String district;
	private String subDistrict;
	private String detailAddress;
	private String additionalAddressInfo;
	private String paymentMethod;
	private String packageId;
	private String sellerNote;
	private String checkedStatus;
	private String checkedMarkedBy;
	private boolean taxInvoiceRequested;
	private String taxBuyerTaxId;
	private String taxType;
	private String taxFullName;
	private String taxEmail;
	private String taxPhone;
	private String taxRegisteredAddress;
	private String taxAddressType;

	public static OrderImportHeaderSnapshot fromRow(OrderSkuListExcelRow row) {
		OrderImportHeaderSnapshot snap = new OrderImportHeaderSnapshot();
		BeanUtils.copyProperties(row, snap);
		return snap;
	}

	public void applyTo(OrderSkuListExcelRow row) {
		BeanUtils.copyProperties(this, row);
	}

	public String getOrderStatus() {
		return orderStatus;
	}

	public void setOrderStatus(String orderStatus) {
		this.orderStatus = orderStatus;
	}

	public String getOrderSubstatus() {
		return orderSubstatus;
	}

	public void setOrderSubstatus(String orderSubstatus) {
		this.orderSubstatus = orderSubstatus;
	}

	public String getCancelReturnType() {
		return cancelReturnType;
	}

	public void setCancelReturnType(String cancelReturnType) {
		this.cancelReturnType = cancelReturnType;
	}

	public String getOrderKind() {
		return orderKind;
	}

	public void setOrderKind(String orderKind) {
		this.orderKind = orderKind;
	}

	public BigDecimal getShippingFeeAfterDiscount() {
		return shippingFeeAfterDiscount;
	}

	public void setShippingFeeAfterDiscount(BigDecimal shippingFeeAfterDiscount) {
		this.shippingFeeAfterDiscount = shippingFeeAfterDiscount;
	}

	public BigDecimal getShippingFeeOriginal() {
		return shippingFeeOriginal;
	}

	public void setShippingFeeOriginal(BigDecimal shippingFeeOriginal) {
		this.shippingFeeOriginal = shippingFeeOriginal;
	}

	public BigDecimal getShippingFeeSellerDisc() {
		return shippingFeeSellerDisc;
	}

	public void setShippingFeeSellerDisc(BigDecimal shippingFeeSellerDisc) {
		this.shippingFeeSellerDisc = shippingFeeSellerDisc;
	}

	public BigDecimal getShippingFeePlatformDisc() {
		return shippingFeePlatformDisc;
	}

	public void setShippingFeePlatformDisc(BigDecimal shippingFeePlatformDisc) {
		this.shippingFeePlatformDisc = shippingFeePlatformDisc;
	}

	public BigDecimal getPaymentPlatformDiscount() {
		return paymentPlatformDiscount;
	}

	public void setPaymentPlatformDiscount(BigDecimal paymentPlatformDiscount) {
		this.paymentPlatformDiscount = paymentPlatformDiscount;
	}

	public BigDecimal getTaxes() {
		return taxes;
	}

	public void setTaxes(BigDecimal taxes) {
		this.taxes = taxes;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public void setTotalAmount(BigDecimal totalAmount) {
		this.totalAmount = totalAmount;
	}

	public BigDecimal getRefundAmount() {
		return refundAmount;
	}

	public void setRefundAmount(BigDecimal refundAmount) {
		this.refundAmount = refundAmount;
	}

	public Instant getOrderDate() {
		return orderDate;
	}

	public void setOrderDate(Instant orderDate) {
		this.orderDate = orderDate;
	}

	public Instant getPaidAt() {
		return paidAt;
	}

	public void setPaidAt(Instant paidAt) {
		this.paidAt = paidAt;
	}

	public Instant getRtsAt() {
		return rtsAt;
	}

	public void setRtsAt(Instant rtsAt) {
		this.rtsAt = rtsAt;
	}

	public Instant getShippedAt() {
		return shippedAt;
	}

	public void setShippedAt(Instant shippedAt) {
		this.shippedAt = shippedAt;
	}

	public Instant getDeliveredAt() {
		return deliveredAt;
	}

	public void setDeliveredAt(Instant deliveredAt) {
		this.deliveredAt = deliveredAt;
	}

	public Instant getCancelledAt() {
		return cancelledAt;
	}

	public void setCancelledAt(Instant cancelledAt) {
		this.cancelledAt = cancelledAt;
	}

	public String getCancelBy() {
		return cancelBy;
	}

	public void setCancelBy(String cancelBy) {
		this.cancelBy = cancelBy;
	}

	public String getCancelReason() {
		return cancelReason;
	}

	public void setCancelReason(String cancelReason) {
		this.cancelReason = cancelReason;
	}

	public String getFulfillmentType() {
		return fulfillmentType;
	}

	public void setFulfillmentType(String fulfillmentType) {
		this.fulfillmentType = fulfillmentType;
	}

	public String getWarehouseName() {
		return warehouseName;
	}

	public void setWarehouseName(String warehouseName) {
		this.warehouseName = warehouseName;
	}

	public String getTrackingId() {
		return trackingId;
	}

	public void setTrackingId(String trackingId) {
		this.trackingId = trackingId;
	}

	public String getDeliveryOption() {
		return deliveryOption;
	}

	public void setDeliveryOption(String deliveryOption) {
		this.deliveryOption = deliveryOption;
	}

	public String getShippingProviderName() {
		return shippingProviderName;
	}

	public void setShippingProviderName(String shippingProviderName) {
		this.shippingProviderName = shippingProviderName;
	}

	public String getBuyerMessage() {
		return buyerMessage;
	}

	public void setBuyerMessage(String buyerMessage) {
		this.buyerMessage = buyerMessage;
	}

	public String getBuyerUsername() {
		return buyerUsername;
	}

	public void setBuyerUsername(String buyerUsername) {
		this.buyerUsername = buyerUsername;
	}

	public String getRecipient() {
		return recipient;
	}

	public void setRecipient(String recipient) {
		this.recipient = recipient;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getZipcode() {
		return zipcode;
	}

	public void setZipcode(String zipcode) {
		this.zipcode = zipcode;
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	public String getProvince() {
		return province;
	}

	public void setProvince(String province) {
		this.province = province;
	}

	public String getDistrict() {
		return district;
	}

	public void setDistrict(String district) {
		this.district = district;
	}

	public String getSubDistrict() {
		return subDistrict;
	}

	public void setSubDistrict(String subDistrict) {
		this.subDistrict = subDistrict;
	}

	public String getDetailAddress() {
		return detailAddress;
	}

	public void setDetailAddress(String detailAddress) {
		this.detailAddress = detailAddress;
	}

	public String getAdditionalAddressInfo() {
		return additionalAddressInfo;
	}

	public void setAdditionalAddressInfo(String additionalAddressInfo) {
		this.additionalAddressInfo = additionalAddressInfo;
	}

	public String getPaymentMethod() {
		return paymentMethod;
	}

	public void setPaymentMethod(String paymentMethod) {
		this.paymentMethod = paymentMethod;
	}

	public String getPackageId() {
		return packageId;
	}

	public void setPackageId(String packageId) {
		this.packageId = packageId;
	}

	public String getSellerNote() {
		return sellerNote;
	}

	public void setSellerNote(String sellerNote) {
		this.sellerNote = sellerNote;
	}

	public String getCheckedStatus() {
		return checkedStatus;
	}

	public void setCheckedStatus(String checkedStatus) {
		this.checkedStatus = checkedStatus;
	}

	public String getCheckedMarkedBy() {
		return checkedMarkedBy;
	}

	public void setCheckedMarkedBy(String checkedMarkedBy) {
		this.checkedMarkedBy = checkedMarkedBy;
	}

	public boolean isTaxInvoiceRequested() {
		return taxInvoiceRequested;
	}

	public void setTaxInvoiceRequested(boolean taxInvoiceRequested) {
		this.taxInvoiceRequested = taxInvoiceRequested;
	}

	public String getTaxBuyerTaxId() {
		return taxBuyerTaxId;
	}

	public void setTaxBuyerTaxId(String taxBuyerTaxId) {
		this.taxBuyerTaxId = taxBuyerTaxId;
	}

	public String getTaxType() {
		return taxType;
	}

	public void setTaxType(String taxType) {
		this.taxType = taxType;
	}

	public String getTaxFullName() {
		return taxFullName;
	}

	public void setTaxFullName(String taxFullName) {
		this.taxFullName = taxFullName;
	}

	public String getTaxEmail() {
		return taxEmail;
	}

	public void setTaxEmail(String taxEmail) {
		this.taxEmail = taxEmail;
	}

	public String getTaxPhone() {
		return taxPhone;
	}

	public void setTaxPhone(String taxPhone) {
		this.taxPhone = taxPhone;
	}

	public String getTaxRegisteredAddress() {
		return taxRegisteredAddress;
	}

	public void setTaxRegisteredAddress(String taxRegisteredAddress) {
		this.taxRegisteredAddress = taxRegisteredAddress;
	}

	public String getTaxAddressType() {
		return taxAddressType;
	}

	public void setTaxAddressType(String taxAddressType) {
		this.taxAddressType = taxAddressType;
	}

	static String blankToNull(String value) {
		return StringUtils.hasText(value) ? value : null;
	}
}
