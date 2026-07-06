package com.laconic.lacoinvoice.integration.sso.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LcnSsoUpdateUserApiResponse {

	private int success;

	private int code;

	private Object meta;

	private LcnSsoUserResponse data;

	private String message;
}
