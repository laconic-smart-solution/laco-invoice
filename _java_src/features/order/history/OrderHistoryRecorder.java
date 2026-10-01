package com.laconic.lacoinvoice.features.order.history;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderHistory;
import com.laconic.lacoinvoice.domain.models.OrderHistoryAction;
import com.laconic.lacoinvoice.domain.models.OrderHistoryChange;
import com.laconic.lacoinvoice.domain.models.OrderHistorySource;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;
import com.laconic.lacoinvoice.domain.repositories.OrderHistoryRepository;

/**
 * Append-only writer for order history events. Never updates or deletes history rows.
 */
@Service
public class OrderHistoryRecorder {

	private final OrderHistoryRepository orderHistoryRepository;

	public OrderHistoryRecorder(OrderHistoryRepository orderHistoryRepository) {
		this.orderHistoryRepository = orderHistoryRepository;
	}

	@Transactional
	public OrderHistory recordManualCreate(Order order, OrderHistorySnapshot after) {
		return record(
				order,
				OrderHistoryAction.CREATE,
				OrderHistorySource.MANUAL,
				null,
				OrderHistorySnapshot.empty(),
				after,
				null);
	}

	@Transactional
	public OrderHistory recordManualUpdate(Order order, OrderHistorySnapshot before, OrderHistorySnapshot after) {
		return record(
				order,
				OrderHistoryAction.UPDATE,
				OrderHistorySource.MANUAL,
				null,
				before,
				after,
				null);
	}

	@Transactional
	public OrderHistory recordImportCreate(Order order, OrderImportFile importFile, OrderHistorySnapshot after) {
		return record(
				order,
				OrderHistoryAction.CREATE,
				OrderHistorySource.IMPORT_EXCEL,
				importFile,
				OrderHistorySnapshot.empty(),
				after,
				null);
	}

	@Transactional
	public OrderHistory recordImportUpdate(
			Order order,
			OrderImportFile importFile,
			OrderHistorySnapshot before,
			OrderHistorySnapshot after) {
		return record(
				order,
				OrderHistoryAction.UPDATE,
				OrderHistorySource.IMPORT_EXCEL,
				importFile,
				before,
				after,
				null);
	}

	@Transactional
	public OrderHistory record(
			Order order,
			OrderHistoryAction action,
			OrderHistorySource source,
			OrderImportFile importFile,
			OrderHistorySnapshot before,
			OrderHistorySnapshot after,
			String note) {
		Objects.requireNonNull(order, "order");
		Objects.requireNonNull(order.getId(), "order.id");
		Objects.requireNonNull(action, "action");
		Objects.requireNonNull(source, "source");
		Objects.requireNonNull(before, "before");
		Objects.requireNonNull(after, "after");

		if (source == OrderHistorySource.IMPORT_EXCEL && (importFile == null || importFile.getId() == null)) {
			throw new IllegalArgumentException("importFile is required for IMPORT_EXCEL history");
		}
		if (source == OrderHistorySource.MANUAL && importFile != null) {
			throw new IllegalArgumentException("importFile must be null for MANUAL history");
		}

		List<OrderHistoryChange> changes = buildChanges(action, before, after);
		if (changes.isEmpty()) {
			return null;
		}

		OrderHistory history = new OrderHistory();
		history.setOrder(order);
		history.setAction(action);
		history.setSource(source);
		history.setImportFile(source == OrderHistorySource.IMPORT_EXCEL ? importFile : null);
		history.setPerformedByUserId(AuditUserContext.getCurrentLocalUserId().orElse(null));
		history.setPerformedAt(Instant.now());
		history.setNote(note);
		for (OrderHistoryChange change : changes) {
			history.addChange(change);
		}
		return orderHistoryRepository.save(history);
	}

	private List<OrderHistoryChange> buildChanges(
			OrderHistoryAction action,
			OrderHistorySnapshot before,
			OrderHistorySnapshot after) {
		List<OrderHistoryChange> changes = new ArrayList<>();
		for (String fieldName : OrderHistorySnapshot.allowlistedFields()) {
			String oldValue = before.get(fieldName);
			String newValue = after.get(fieldName);

			if (action == OrderHistoryAction.CREATE) {
				if (newValue == null) {
					continue;
				}
				oldValue = null;
			} else if (action == OrderHistoryAction.DELETE) {
				if (oldValue == null) {
					continue;
				}
				newValue = null;
			} else if (OrderHistorySnapshot.valuesEqual(oldValue, newValue)) {
				continue;
			}

			OrderHistoryChange change = new OrderHistoryChange();
			change.setFieldName(fieldName);
			change.setFieldLabelKey(OrderHistorySnapshot.fieldLabelKey(fieldName));
			change.setOldValue(oldValue);
			change.setNewValue(newValue);
			change.setValueType(OrderHistorySnapshot.valueType(fieldName));
			changes.add(change);
		}
		return changes;
	}
}
