package com.laconic.lacoinvoice.features.order.import_;

import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.models.OrderStatus;

/**
 * Maps marketplace / Excel free-text order statuses to {@link OrderStatus}.
 */
public final class OrderStatusTextMapper {

	private OrderStatusTextMapper() {
	}

	public static OrderStatus parse(String raw) {
		if (!StringUtils.hasText(raw)) {
			return OrderStatus.PENDING;
		}
		String primary = raw.trim().split(",")[0].trim();
		String upper = primary.toUpperCase().replace(' ', '_');

		try {
			return OrderStatus.valueOf(upper);
		} catch (IllegalArgumentException ignored) {
			// fall through
		}

		return switch (primary) {
			case "已完成", "完成", "已送达", "已收货" -> OrderStatus.DELIVERED;
			case "已发货", "运输中", "已揽收" -> OrderStatus.SHIPPED;
			case "待发货", "待揽收", "待处理", "处理中", "已付款", "待发货（待揽收）" -> OrderStatus.CONFIRMED;
			case "已取消", "取消", "已关闭" -> OrderStatus.CANCELLED;
			case "未付款", "待付款" -> OrderStatus.PENDING;
			default -> mapEnglishAlias(upper);
		};
	}

	private static OrderStatus mapEnglishAlias(String raw) {
		return switch (raw) {
			case "READY_TO_SHIP", "PACKED", "REPACKED", "READY_TO_SHIP_PENDING",
					"AWAITING_SHIPMENT", "AWAITING_COLLECTION", "PARTIALLY_SHIPPING", "COMPLETED" ->
					OrderStatus.CONFIRMED;
			case "SHIPPED", "SHIPPING", "IN_TRANSIT" -> OrderStatus.SHIPPED;
			case "DELIVERED" -> OrderStatus.DELIVERED;
			case "CANCELED", "CANCELLED", "FAILED", "RETURNED" -> OrderStatus.CANCELLED;
			case "UNPAID", "PENDING", "PROCESSING" -> OrderStatus.PENDING;
			default -> OrderStatus.PENDING;
		};
	}
}
