package com.laconic.lacoinvoice.domain.models;

/**
 * How an order or line item entered the system.
 * {@link #IMPORT} rows reference {@code source_id} = {@code order_import_files.id}.
 */
public enum OrderSourceType {
	API,
	IMPORT
}
