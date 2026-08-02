package com.laconic.lacoinvoice.features.order.import_;

import java.math.BigDecimal;

public class OrderSkuListLineItem {

	private String platformSkuId;
	private String sellerSku;
	private String productName;
	private String variation;
	private Integer quantity;
	private Integer quantityReturned;
	private BigDecimal unitPrice;
	private BigDecimal subtotalBeforeDiscount;
	private BigDecimal platformDiscount;
	private BigDecimal sellerDiscount;
	private BigDecimal lineTotal;
	private BigDecimal weightKg;
	private String productCategory;

	public String getPlatformSkuId() {
		return platformSkuId;
	}

	public void setPlatformSkuId(String platformSkuId) {
		this.platformSkuId = platformSkuId;
	}

	public String getSellerSku() {
		return sellerSku;
	}

	public void setSellerSku(String sellerSku) {
		this.sellerSku = sellerSku;
	}

	public String getProductName() {
		return productName;
	}

	public void setProductName(String productName) {
		this.productName = productName;
	}

	public String getVariation() {
		return variation;
	}

	public void setVariation(String variation) {
		this.variation = variation;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	public Integer getQuantityReturned() {
		return quantityReturned;
	}

	public void setQuantityReturned(Integer quantityReturned) {
		this.quantityReturned = quantityReturned;
	}

	public BigDecimal getUnitPrice() {
		return unitPrice;
	}

	public void setUnitPrice(BigDecimal unitPrice) {
		this.unitPrice = unitPrice;
	}

	public BigDecimal getSubtotalBeforeDiscount() {
		return subtotalBeforeDiscount;
	}

	public void setSubtotalBeforeDiscount(BigDecimal subtotalBeforeDiscount) {
		this.subtotalBeforeDiscount = subtotalBeforeDiscount;
	}

	public BigDecimal getPlatformDiscount() {
		return platformDiscount;
	}

	public void setPlatformDiscount(BigDecimal platformDiscount) {
		this.platformDiscount = platformDiscount;
	}

	public BigDecimal getSellerDiscount() {
		return sellerDiscount;
	}

	public void setSellerDiscount(BigDecimal sellerDiscount) {
		this.sellerDiscount = sellerDiscount;
	}

	public BigDecimal getLineTotal() {
		return lineTotal;
	}

	public void setLineTotal(BigDecimal lineTotal) {
		this.lineTotal = lineTotal;
	}

	public BigDecimal getWeightKg() {
		return weightKg;
	}

	public void setWeightKg(BigDecimal weightKg) {
		this.weightKg = weightKg;
	}

	public String getProductCategory() {
		return productCategory;
	}

	public void setProductCategory(String productCategory) {
		this.productCategory = productCategory;
	}
}
