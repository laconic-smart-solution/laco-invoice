package com.laconic.lacoinvoice.features.order.import_;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OrderImportPreviewExcelRowsDto {

	private Long previewOrderId;
	private String externalOrderId;
	private final List<String> columns = new ArrayList<>();
	private final List<OrderImportPreviewExcelRowDto> rows = new ArrayList<>();

	public Long getPreviewOrderId() {
		return previewOrderId;
	}

	public void setPreviewOrderId(Long previewOrderId) {
		this.previewOrderId = previewOrderId;
	}

	public String getExternalOrderId() {
		return externalOrderId;
	}

	public void setExternalOrderId(String externalOrderId) {
		this.externalOrderId = externalOrderId;
	}

	public List<String> getColumns() {
		return columns;
	}

	public List<OrderImportPreviewExcelRowDto> getRows() {
		return rows;
	}

	public static class OrderImportPreviewExcelRowDto {

		private Integer excelRowIndex;
		private Map<String, String> values = new LinkedHashMap<>();

		public Integer getExcelRowIndex() {
			return excelRowIndex;
		}

		public void setExcelRowIndex(Integer excelRowIndex) {
			this.excelRowIndex = excelRowIndex;
		}

		public Map<String, String> getValues() {
			return values;
		}

		public void setValues(Map<String, String> values) {
			this.values = values != null ? values : new LinkedHashMap<>();
		}
	}
}
