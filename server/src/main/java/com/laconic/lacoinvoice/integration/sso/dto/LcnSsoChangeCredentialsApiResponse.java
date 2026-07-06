package com.laconic.lacoinvoice.integration.sso.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LcnSsoChangeCredentialsApiResponse {

	private int success;

	private int code;

	private Object meta;

	private LcnSsoCredentialsResponse data;

	private String message;
}
