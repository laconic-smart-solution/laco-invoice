package com.laconic.lacoinvoice.common.logging;

public final class MdcKeys {

	public static final String REQUEST_ID = "requestId";
	public static final String HTTP_METHOD = "httpMethod";
	public static final String HTTP_PATH = "httpPath";
	public static final String HTTP_STATUS = "httpStatus";
	public static final String CLIENT_IP = "clientIp";
	public static final String USER_ID = "userId";
	public static final String DURATION_MS = "durationMs";

	private MdcKeys() {
	}
}
