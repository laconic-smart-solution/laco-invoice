package com.laconic.lacoinvoice.features.me;

import com.laconic.lacoinvoice.features.me.dto.MeCredentialsRequest;
import com.laconic.lacoinvoice.features.me.dto.MeProfileDto;

public interface MeProfileService {

	MeProfileDto getMyProfile();

	MeProfileDto changeMyCredentials(MeCredentialsRequest request);
}
