package com.laconic.lacoinvoice.features.order.import_;

import java.util.ArrayList;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.OrderImportResolveAction;

public class OrderImportDecideRequest {

	private OrderImportResolveAction bulkDuplicatesAction;
	private final List<OrderImportDecideUpdate> updates = new ArrayList<>();

	public OrderImportResolveAction getBulkDuplicatesAction() {
		return bulkDuplicatesAction;
	}

	public void setBulkDuplicatesAction(OrderImportResolveAction bulkDuplicatesAction) {
		this.bulkDuplicatesAction = bulkDuplicatesAction;
	}

	public List<OrderImportDecideUpdate> getUpdates() {
		return updates;
	}

	public static class OrderImportDecideUpdate {

		private Long previewOrderId;
		private OrderImportResolveAction resolveAction;

		public Long getPreviewOrderId() {
			return previewOrderId;
		}

		public void setPreviewOrderId(Long previewOrderId) {
			this.previewOrderId = previewOrderId;
		}

		public OrderImportResolveAction getResolveAction() {
			return resolveAction;
		}

		public void setResolveAction(OrderImportResolveAction resolveAction) {
			this.resolveAction = resolveAction;
		}
	}
}
