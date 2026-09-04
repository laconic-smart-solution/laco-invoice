package com.laconic.lacoinvoice.features.erp.client;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ErpPostVoucherRequest {

	private LocalDate voucherDate;
	private String voucherCategory;
	private String currency;
	private String voucherBrief;
	private String voucherDescription;
	private LocalDate taxMonth;
	private LocalDate whtMonth;
	private Boolean noTaxInvoice;
	private Long vendorId;
	private String chequeTransferNumber;
	private String createdBy;
	private List<ErpPostVoucherEntryRequest> entries = new ArrayList<>();

	public LocalDate getVoucherDate() {
		return voucherDate;
	}

	public void setVoucherDate(LocalDate voucherDate) {
		this.voucherDate = voucherDate;
	}

	public String getVoucherCategory() {
		return voucherCategory;
	}

	public void setVoucherCategory(String voucherCategory) {
		this.voucherCategory = voucherCategory;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public String getVoucherBrief() {
		return voucherBrief;
	}

	public void setVoucherBrief(String voucherBrief) {
		this.voucherBrief = voucherBrief;
	}

	public String getVoucherDescription() {
		return voucherDescription;
	}

	public void setVoucherDescription(String voucherDescription) {
		this.voucherDescription = voucherDescription;
	}

	public LocalDate getTaxMonth() {
		return taxMonth;
	}

	public void setTaxMonth(LocalDate taxMonth) {
		this.taxMonth = taxMonth;
	}

	public LocalDate getWhtMonth() {
		return whtMonth;
	}

	public void setWhtMonth(LocalDate whtMonth) {
		this.whtMonth = whtMonth;
	}

	public Boolean getNoTaxInvoice() {
		return noTaxInvoice;
	}

	public void setNoTaxInvoice(Boolean noTaxInvoice) {
		this.noTaxInvoice = noTaxInvoice;
	}

	public Long getVendorId() {
		return vendorId;
	}

	public void setVendorId(Long vendorId) {
		this.vendorId = vendorId;
	}

	public String getChequeTransferNumber() {
		return chequeTransferNumber;
	}

	public void setChequeTransferNumber(String chequeTransferNumber) {
		this.chequeTransferNumber = chequeTransferNumber;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public List<ErpPostVoucherEntryRequest> getEntries() {
		return entries;
	}

	public void setEntries(List<ErpPostVoucherEntryRequest> entries) {
		this.entries = entries;
	}
}
