package com.laconic.lacoinvoice.features.me.dto;

import com.laconic.lacoinvoice.domain.models.UserRole;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeProfileDto {

	private Long id;

	private String email;

	private String fullName;

	private UserRole role;

	private boolean active;

	/** When true, order input create flow hides file type selector and auto-detects via AI. */
	private boolean orderInputAiAutoChoose;
}
