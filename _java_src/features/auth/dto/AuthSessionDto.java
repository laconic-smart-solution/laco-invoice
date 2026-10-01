package com.laconic.lacoinvoice.features.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthSessionDto {

	private Long userId;

	private String email;

	private boolean otpVerified;
}
