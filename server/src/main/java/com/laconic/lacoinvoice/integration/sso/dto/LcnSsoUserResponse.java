package com.laconic.lacoinvoice.integration.sso.dto;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LcnSsoUserResponse {

	private UUID id;

	private String username;

	private String email;
}
