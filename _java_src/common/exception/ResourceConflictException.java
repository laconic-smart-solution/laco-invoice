package com.laconic.lacoinvoice.common.exception;

public class ResourceConflictException extends RuntimeException {

	private final Object meta;

	public ResourceConflictException(String message) {
		this(message, null);
	}

	public ResourceConflictException(String message, Object meta) {
		super(message);
		this.meta = meta;
	}

	public Object getMeta() {
		return meta;
	}
}
