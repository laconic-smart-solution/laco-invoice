package com.laconic.lacoinvoice.features.order.import_;

import java.util.ArrayList;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.OrderImportStatus;

public class OrderImportResultDto {

	private Long importFileId;
	private String sheetName;
	private int rowCount;
	private int orderCount;
	private int itemCount;
	private OrderImportStatus status;
	private final List<String> errors = new ArrayList<>();

	public Long getImportFileId() {
		return importFileId;
	}

	public void setImportFileId(Long importFileId) {
		this.importFileId = importFileId;
	}

	public String getSheetName() {
		return sheetName;
	}

	public void setSheetName(String sheetName) {
		this.sheetName = sheetName;
	}

	public int getRowCount() {
		return rowCount;
	}

	public void setRowCount(int rowCount) {
		this.rowCount = rowCount;
	}

	public int getOrderCount() {
		return orderCount;
	}

	public void setOrderCount(int orderCount) {
		this.orderCount = orderCount;
	}

	public int getItemCount() {
		return itemCount;
	}

	public void setItemCount(int itemCount) {
		this.itemCount = itemCount;
	}

	public OrderImportStatus getStatus() {
		return status;
	}

	public void setStatus(OrderImportStatus status) {
		this.status = status;
	}

	public List<String> getErrors() {
		return errors;
	}
}
