package com.laconic.lacoinvoice.features.order.import_;

import java.util.ArrayList;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.OrderImportBatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderImportMatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderImportResolveAction;

public class OrderImportPreviewBatchDto {

	private Long batchId;
	private OrderImportBatchStatus status;
	private String sheetName;
	private String originalFilename;
	private int rowCount;
	private int totalOrders;
	private int newCount;
	private int duplicateCount;
	private String expiresAt;
	private final List<OrderImportPreviewOrderDto> orders = new ArrayList<>();

	public Long getBatchId() {
		return batchId;
	}

	public void setBatchId(Long batchId) {
		this.batchId = batchId;
	}

	public OrderImportBatchStatus getStatus() {
		return status;
	}

	public void setStatus(OrderImportBatchStatus status) {
		this.status = status;
	}

	public String getSheetName() {
		return sheetName;
	}

	public void setSheetName(String sheetName) {
		this.sheetName = sheetName;
	}

	public String getOriginalFilename() {
		return originalFilename;
	}

	public void setOriginalFilename(String originalFilename) {
		this.originalFilename = originalFilename;
	}

	public int getRowCount() {
		return rowCount;
	}

	public void setRowCount(int rowCount) {
		this.rowCount = rowCount;
	}

	public int getTotalOrders() {
		return totalOrders;
	}

	public void setTotalOrders(int totalOrders) {
		this.totalOrders = totalOrders;
	}

	public int getNewCount() {
		return newCount;
	}

	public void setNewCount(int newCount) {
		this.newCount = newCount;
	}

	public int getDuplicateCount() {
		return duplicateCount;
	}

	public void setDuplicateCount(int duplicateCount) {
		this.duplicateCount = duplicateCount;
	}

	public String getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(String expiresAt) {
		this.expiresAt = expiresAt;
	}

	public List<OrderImportPreviewOrderDto> getOrders() {
		return orders;
	}

	public static class OrderImportPreviewOrderDto {

		private Long id;
		private String externalOrderId;
		private OrderImportMatchStatus matchStatus;
		private Long existingOrderId;
		private OrderImportResolveAction resolveAction;
		private String resolveSource;
		private Integer excelItemCount;
		private Integer existingItemCount;
		private java.math.BigDecimal excelTotalAmount;
		private java.math.BigDecimal existingTotalAmount;
		private String warningCode;

		public Long getId() {
			return id;
		}

		public void setId(Long id) {
			this.id = id;
		}

		public String getExternalOrderId() {
			return externalOrderId;
		}

		public void setExternalOrderId(String externalOrderId) {
			this.externalOrderId = externalOrderId;
		}

		public OrderImportMatchStatus getMatchStatus() {
			return matchStatus;
		}

		public void setMatchStatus(OrderImportMatchStatus matchStatus) {
			this.matchStatus = matchStatus;
		}

		public Long getExistingOrderId() {
			return existingOrderId;
		}

		public void setExistingOrderId(Long existingOrderId) {
			this.existingOrderId = existingOrderId;
		}

		public OrderImportResolveAction getResolveAction() {
			return resolveAction;
		}

		public void setResolveAction(OrderImportResolveAction resolveAction) {
			this.resolveAction = resolveAction;
		}

		public String getResolveSource() {
			return resolveSource;
		}

		public void setResolveSource(String resolveSource) {
			this.resolveSource = resolveSource;
		}

		public Integer getExcelItemCount() {
			return excelItemCount;
		}

		public void setExcelItemCount(Integer excelItemCount) {
			this.excelItemCount = excelItemCount;
		}

		public Integer getExistingItemCount() {
			return existingItemCount;
		}

		public void setExistingItemCount(Integer existingItemCount) {
			this.existingItemCount = existingItemCount;
		}

		public java.math.BigDecimal getExcelTotalAmount() {
			return excelTotalAmount;
		}

		public void setExcelTotalAmount(java.math.BigDecimal excelTotalAmount) {
			this.excelTotalAmount = excelTotalAmount;
		}

		public java.math.BigDecimal getExistingTotalAmount() {
			return existingTotalAmount;
		}

		public void setExistingTotalAmount(java.math.BigDecimal existingTotalAmount) {
			this.existingTotalAmount = existingTotalAmount;
		}

		public String getWarningCode() {
			return warningCode;
		}

		public void setWarningCode(String warningCode) {
			this.warningCode = warningCode;
		}
	}
}
