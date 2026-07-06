package com.laconic.lacoinvoice.common.exception;

public class BusinessRuleException extends RuntimeException {

	private final Object meta;

	public BusinessRuleException(String message) {
		this(message, null);
	}

	public BusinessRuleException(String message, Object meta) {
		super(message);
		this.meta = meta;
	}

	public Object getMeta() {
		return meta;
	}
}
