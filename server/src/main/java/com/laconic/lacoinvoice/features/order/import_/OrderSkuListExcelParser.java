package com.laconic.lacoinvoice.features.order.import_;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Component
public class OrderSkuListExcelParser {

	private static final String SHEET_NAME = "OrderSKUList";
	private static final String ORDER_ID_HEADER = "Order ID";
	private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Bangkok");
	private static final DateTimeFormatter DATE_TIME =
			DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
	private static final int HEADER_SCAN_LIMIT = 20;

	private final DataFormatter formatter = new DataFormatter();

	public ParsedOrderSkuListWorkbook parse(MultipartFile file) {
		try {
			return parse(file.getInputStream());
		} catch (IllegalArgumentException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalArgumentException("Failed to parse Excel: " + ex.getMessage(), ex);
		}
	}

	public ParsedOrderSkuListWorkbook parse(java.io.InputStream inputStream) {
		try (Workbook workbook = WorkbookFactory.create(inputStream)) {
			Sheet sheet = workbook.getSheet(SHEET_NAME);
			if (sheet == null) {
				sheet = workbook.getSheetAt(0);
			}
			int headerRowIndex = findHeaderRowIndex(sheet);
			Row headerRow = sheet.getRow(headerRowIndex);
			Map<String, Integer> columnIndex = buildColumnIndex(headerRow);
			if (!columnIndex.containsKey(ORDER_ID_HEADER)) {
				throw new IllegalArgumentException(
						"Excel header row must include '" + ORDER_ID_HEADER + "'");
			}

			Map<String, OrderSkuListExcelRow> orders = new HashMap<>();
			int dataRows = 0;
			for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
				Row row = sheet.getRow(i);
				if (row == null || isEmptyRow(row, columnIndex)) {
					continue;
				}
				OrderSkuListExcelRow parsed = toRow(row, columnIndex);
				if (!StringUtils.hasText(parsed.orderId()) || !isLikelyOrderId(parsed.orderId())) {
					// Skip description / helper rows under the header.
					continue;
				}
				dataRows++;
				orders.compute(parsed.orderId(), (id, existing) -> {
					if (existing == null) {
						return parsed;
					}
					existing.lineItems().addAll(parsed.lineItems());
					return existing;
				});
			}
			return new ParsedOrderSkuListWorkbook(sheet.getSheetName(), dataRows, orders);
		} catch (IllegalArgumentException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalArgumentException("Failed to parse Excel: " + ex.getMessage(), ex);
		}
	}

	private int findHeaderRowIndex(Sheet sheet) {
		int last = Math.min(sheet.getLastRowNum(), HEADER_SCAN_LIMIT);
		for (int i = 0; i <= last; i++) {
			Row row = sheet.getRow(i);
			if (row == null) {
				continue;
			}
			for (Cell cell : row) {
				String value = formatter.formatCellValue(cell).trim();
				if (ORDER_ID_HEADER.equals(value)) {
					return i;
				}
			}
		}
		throw new IllegalArgumentException(
				"Could not find Excel header row containing '" + ORDER_ID_HEADER + "'");
	}

	private Map<String, Integer> buildColumnIndex(Row headerRow) {
		Map<String, Integer> index = new java.util.LinkedHashMap<>();
		for (Cell cell : headerRow) {
			String name = formatter.formatCellValue(cell).trim();
			if (StringUtils.hasText(name)) {
				index.put(name, cell.getColumnIndex());
			}
		}
		return index;
	}

	private boolean isEmptyRow(Row row, Map<String, Integer> columnIndex) {
		Integer orderCol = columnIndex.get(ORDER_ID_HEADER);
		if (orderCol == null) {
			return true;
		}
		return !StringUtils.hasText(cellValue(row, orderCol));
	}

	/**
	 * TikTok exports put a description row under the header (e.g. "Platform unique order ID.").
	 * Real order IDs are long numeric strings.
	 */
	private static boolean isLikelyOrderId(String orderId) {
		String trimmed = orderId.trim();
		if (trimmed.length() < 8) {
			return false;
		}
		for (int i = 0; i < trimmed.length(); i++) {
			if (!Character.isDigit(trimmed.charAt(i))) {
				return false;
			}
		}
		return true;
	}

	private OrderSkuListExcelRow toRow(Row row, Map<String, Integer> cols) {
		String orderId = cell(cols, row, ORDER_ID_HEADER);
		OrderSkuListExcelRow order = new OrderSkuListExcelRow(orderId);
		order.setOrderStatus(cell(cols, row, "Order Status"));
		order.setOrderSubstatus(cell(cols, row, "Order Substatus"));
		order.setCancelReturnType(cell(cols, row, "Cancelation/Return Type"));
		order.setOrderKind(normalizeOrderKind(cell(cols, row, "Normal or Pre-order")));
		order.setShippingFeeAfterDiscount(decimal(cols, row, "Shipping Fee After Discount"));
		order.setShippingFeeOriginal(decimal(cols, row, "Original Shipping Fee"));
		order.setShippingFeeSellerDisc(decimal(cols, row, "Shipping Fee Seller Discount"));
		order.setShippingFeePlatformDisc(decimal(cols, row, "Shipping Fee Platform Discount"));
		order.setPaymentPlatformDiscount(decimal(cols, row, "Payment platform discount"));
		order.setTaxes(decimal(cols, row, "Taxes"));
		order.setTotalAmount(decimal(cols, row, "Order Amount"));
		order.setRefundAmount(decimal(cols, row, "Order Refund Amount"));
		order.setOrderDate(instant(cols, row, "Created Time"));
		order.setPaidAt(instant(cols, row, "Paid Time"));
		order.setRtsAt(instant(cols, row, "RTS Time"));
		order.setShippedAt(instant(cols, row, "Shipped Time"));
		order.setDeliveredAt(instant(cols, row, "Delivered Time"));
		order.setCancelledAt(instant(cols, row, "Cancelled Time"));
		order.setCancelBy(cell(cols, row, "Cancel By"));
		order.setCancelReason(cell(cols, row, "Cancel Reason"));
		order.setFulfillmentType(cell(cols, row, "Fulfillment Type"));
		order.setWarehouseName(cell(cols, row, "Warehouse Name"));
		order.setTrackingId(cell(cols, row, "Tracking ID"));
		order.setDeliveryOption(cell(cols, row, "Delivery Option"));
		order.setShippingProviderName(cell(cols, row, "Shipping Provider Name"));
		order.setBuyerMessage(cell(cols, row, "Buyer Message"));
		order.setBuyerUsername(cell(cols, row, "Buyer Username"));
		order.setRecipient(cell(cols, row, "Recipient"));
		order.setPhone(cell(cols, row, "Phone #"));
		order.setZipcode(cell(cols, row, "Zipcode"));
		order.setCountry(cell(cols, row, "Country"));
		order.setProvince(cell(cols, row, "Province"));
		order.setDistrict(cell(cols, row, "District"));
		order.setSubDistrict(cell(cols, row, "Districts"));
		order.setDetailAddress(cell(cols, row, "Detail Address"));
		order.setAdditionalAddressInfo(cell(cols, row, "Additional address information"));
		order.setPaymentMethod(cell(cols, row, "Payment Method"));
		order.setPackageId(cell(cols, row, "Package ID"));
		order.setSellerNote(cell(cols, row, "Seller Note"));
		order.setCheckedStatus(cell(cols, row, "Checked Status"));
		order.setCheckedMarkedBy(cell(cols, row, "Checked Marked by"));
		order.setTaxInvoiceRequested(booleanCell(cols, row, "Request Tax Invoice"));
		order.setTaxBuyerTaxId(cell(cols, row, "Tax Info - Buyer Tax ID"));
		order.setTaxType(cell(cols, row, "Tax Info - Type"));
		order.setTaxFullName(cell(cols, row, "Tax Info - Full Name of Buyer"));
		order.setTaxEmail(cell(cols, row, "Tax Info - Email"));
		order.setTaxPhone(cell(cols, row, "Tax Info - Phone Number"));
		order.setTaxRegisteredAddress(cell(cols, row, "Tax Info - Registered Address"));
		order.setTaxAddressType(cell(cols, row, "Tax Info - Address Type"));

		OrderSkuListLineItem line = new OrderSkuListLineItem();
		line.setExcelRowIndex(row.getRowNum() + 1);
		line.setExcelColumns(captureAllColumns(row, cols));
		line.setPlatformSkuId(cell(cols, row, "SKU ID"));
		line.setSellerSku(cell(cols, row, "Seller SKU"));
		line.setProductName(cell(cols, row, "Product Name"));
		line.setVariation(cell(cols, row, "Variation"));
		line.setQuantity(intValue(cols, row, "Quantity"));
		line.setQuantityReturned(intValue(cols, row, "Sku Quantity of return"));
		line.setUnitPrice(decimal(cols, row, "SKU Unit Original Price"));
		line.setSubtotalBeforeDiscount(decimal(cols, row, "SKU Subtotal Before Discount"));
		line.setPlatformDiscount(decimal(cols, row, "SKU Platform Discount"));
		line.setSellerDiscount(decimal(cols, row, "SKU Seller Discount"));
		line.setLineTotal(decimal(cols, row, "SKU Subtotal After Discount"));
		line.setWeightKg(decimal(cols, row, "Weight(kg)"));
		line.setProductCategory(cell(cols, row, "Product Category"));
		order.lineItems().add(line);
		return order;
	}

	private Map<String, String> captureAllColumns(Row row, Map<String, Integer> cols) {
		Map<String, String> values = new java.util.LinkedHashMap<>();
		for (Map.Entry<String, Integer> entry : cols.entrySet()) {
			String raw = cellValue(row, entry.getValue());
			values.put(entry.getKey(), StringUtils.hasText(raw) ? raw.trim() : "");
		}
		return values;
	}

	private String cell(Map<String, Integer> cols, Row row, String name) {
		Integer idx = cols.get(name);
		if (idx == null) {
			return null;
		}
		String value = cellValue(row, idx);
		return StringUtils.hasText(value) ? value.trim() : null;
	}

	private String cellValue(Row row, int idx) {
		Cell cell = row.getCell(idx);
		if (cell == null) {
			return "";
		}
		return formatter.formatCellValue(cell).trim();
	}

	private BigDecimal decimal(Map<String, Integer> cols, Row row, String name) {
		String raw = cell(cols, row, name);
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		try {
			return new BigDecimal(raw.replace(",", ""));
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private Integer intValue(Map<String, Integer> cols, Row row, String name) {
		String raw = cell(cols, row, name);
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		try {
			return new BigDecimal(raw.replace(",", "")).intValue();
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private boolean booleanCell(Map<String, Integer> cols, Row row, String name) {
		String raw = cell(cols, row, name);
		if (!StringUtils.hasText(raw)) {
			return false;
		}
		String lower = raw.toLowerCase();
		return lower.equals("yes") || lower.equals("true") || lower.equals("1") || lower.contains("request");
	}

	private Instant instant(Map<String, Integer> cols, Row row, String name) {
		String raw = cell(cols, row, name);
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		try {
			return LocalDateTime.parse(raw, DATE_TIME).atZone(DEFAULT_ZONE).toInstant();
		} catch (DateTimeParseException ex) {
			return null;
		}
	}

	private static String normalizeOrderKind(String raw) {
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		String upper = raw.trim().toUpperCase().replace(' ', '_').replace('-', '_');
		if (upper.contains("PRE")) {
			return "PRE_ORDER";
		}
		return "NORMAL";
	}
}
