package com.laconic.lacoinvoice.common.persistence;

/**
 * Domain enums persisted as {@code INTEGER} codes in Oracle.
 * Add new enum constants with a new unique code; do not reuse codes once deployed.
 */
public interface PersistableEnum {

	int getCode();
}
