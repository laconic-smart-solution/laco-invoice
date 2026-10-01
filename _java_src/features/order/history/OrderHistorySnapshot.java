package com.laconic.lacoinvoice.features.order.history;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderHistoryValueType;
import com.laconic.lacoinvoice.domain.models.OrderStatus;

/**
 * Captures allowlisted order field values as canonical strings for history diffs.
 */
public final class OrderHistorySnapshot {

	public static final String FIELD_ORDER_STATUS = "order_status";
	public static final String FIELD_ORDER_SUBSTATUS = "order_substatus";
	public static final String FIELD_TOTAL_AMOUNT = "total_amount";
	public static final String FIELD_SUBTOTAL = "subtotal";
	public static final String FIELD_SHIPPING_FEE = "shipping_fee";
	public static final String FIELD_AMOUNT_EX_VAT = "amount_ex_vat";
	public static final String FIELD_VAT_AMOUNT = "vat_amount";
	public static final String FIELD_CURRENCY = "currency";
	public static final String FIELD_ORDER_DATE = "order_date";
	public static final String FIELD_BUYER_MESSAGE = "buyer_message";
	public static final String FIELD_SELLER_NOTE = "seller_note";

	private static final Map<String, OrderHistoryValueType> VALUE_TYPES;

	static {
		Map<String, OrderHistoryValueType> types = new LinkedHashMap<>();
		types.put(FIELD_ORDER_STATUS, OrderHistoryValueType.ENUM);
		types.put(FIELD_ORDER_SUBSTATUS, OrderHistoryValueType.STRING);
		types.put(FIELD_TOTAL_AMOUNT, OrderHistoryValueType.DECIMAL);
		types.put(FIELD_SUBTOTAL, OrderHistoryValueType.DECIMAL);
		types.put(FIELD_SHIPPING_FEE, OrderHistoryValueType.DECIMAL);
		types.put(FIELD_AMOUNT_EX_VAT, OrderHistoryValueType.DECIMAL);
		types.put(FIELD_VAT_AMOUNT, OrderHistoryValueType.DECIMAL);
		types.put(FIELD_CURRENCY, OrderHistoryValueType.STRING);
		types.put(FIELD_ORDER_DATE, OrderHistoryValueType.DATETIME);
		types.put(FIELD_BUYER_MESSAGE, OrderHistoryValueType.TEXT);
		types.put(FIELD_SELLER_NOTE, OrderHistoryValueType.TEXT);
		VALUE_TYPES = Collections.unmodifiableMap(types);
	}

	private final Map<String, String> values;

	private OrderHistorySnapshot(Map<String, String> values) {
		this.values = Collections.unmodifiableMap(values);
	}

	public static OrderHistorySnapshot empty() {
		return new OrderHistorySnapshot(Map.of());
	}

	public static OrderHistorySnapshot capture(Order order) {
		if (order == null) {
			return empty();
		}
		Map<String, String> values = new LinkedHashMap<>();
		values.put(FIELD_ORDER_STATUS, formatEnum(order.getOrderStatus()));
		values.put(FIELD_ORDER_SUBSTATUS, formatString(order.getOrderSubstatus()));
		values.put(FIELD_TOTAL_AMOUNT, formatDecimal(order.getTotalAmount()));
		values.put(FIELD_SUBTOTAL, formatDecimal(order.getSubtotal()));
		values.put(FIELD_SHIPPING_FEE, formatDecimal(order.getShippingFee()));
		values.put(FIELD_AMOUNT_EX_VAT, formatDecimal(order.getAmountExVat()));
		values.put(FIELD_VAT_AMOUNT, formatDecimal(order.getVatAmount()));
		values.put(FIELD_CURRENCY, formatString(order.getCurrency()));
		values.put(FIELD_ORDER_DATE, formatInstant(order.getOrderDate()));
		values.put(FIELD_BUYER_MESSAGE, formatString(order.getBuyerMessage()));
		values.put(FIELD_SELLER_NOTE, formatString(order.getSellerNote()));
		return new OrderHistorySnapshot(values);
	}

	public Map<String, String> values() {
		return values;
	}

	public String get(String fieldName) {
		return values.get(fieldName);
	}

	public static OrderHistoryValueType valueType(String fieldName) {
		return VALUE_TYPES.getOrDefault(fieldName, OrderHistoryValueType.STRING);
	}

	public static String fieldLabelKey(String fieldName) {
		return "history.fields." + fieldName;
	}

	public static Iterable<String> allowlistedFields() {
		return VALUE_TYPES.keySet();
	}

	public static boolean valuesEqual(String left, String right) {
		return Objects.equals(normalize(left), normalize(right));
	}

	private static String normalize(String value) {
		return value;
	}

	private static String formatString(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value;
	}

	private static String formatDecimal(BigDecimal value) {
		if (value == null) {
			return null;
		}
		return value.stripTrailingZeros().toPlainString();
	}

	private static String formatInstant(Instant value) {
		return value == null ? null : value.toString();
	}

	private static String formatEnum(OrderStatus status) {
		return status == null ? null : status.name();
	}
}
