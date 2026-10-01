package com.laconic.lacoinvoice.features.order.inputrun;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.domain.models.InvoicePdfMatchStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputFileStatus;
import com.laconic.lacoinvoice.domain.models.OrderInputRun;
import com.laconic.lacoinvoice.domain.models.OrderInputRunStatus;

import jakarta.persistence.criteria.Predicate;

final class OrderInputRunSpecifications {

	private OrderInputRunSpecifications() {
	}

	static Specification<OrderInputRun> displayStatus(String statusFilter) {
		if (!StringUtils.hasText(statusFilter)) {
			return null;
		}
		String normalized = statusFilter.trim().toUpperCase();
		if ("ERROR".equals(normalized)) {
			return hasInvoiceDisplayError();
		}
		OrderInputRunStatus runStatus;
		try {
			runStatus = OrderInputRunStatus.valueOf(normalized);
		} catch (IllegalArgumentException ex) {
			return null;
		}
		return hasRunStatusWithoutInvoiceError(runStatus);
	}

	private static Specification<OrderInputRun> hasInvoiceDisplayError() {
		return (root, query, cb) -> cb.or(
				root.get("invoiceMatchStatus").in(
						InvoicePdfMatchStatus.MISMATCH,
						InvoicePdfMatchStatus.UNPARSED),
				cb.equal(root.get("invoicePdfStatus"), OrderInputFileStatus.FAILED));
	}

	private static Specification<OrderInputRun> hasRunStatusWithoutInvoiceError(OrderInputRunStatus runStatus) {
		return (root, query, cb) -> {
			Predicate statusMatch = cb.equal(root.get("status"), runStatus);
			Predicate noInvoiceError = cb.not(hasInvoiceDisplayError().toPredicate(root, query, cb));
			return cb.and(statusMatch, noInvoiceError);
		};
	}
}
