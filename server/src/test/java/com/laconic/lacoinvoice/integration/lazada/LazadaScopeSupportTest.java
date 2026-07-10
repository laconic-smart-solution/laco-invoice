package com.laconic.lacoinvoice.integration.lazada;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class LazadaScopeSupportTest {

	@Test
	void toTenantUuidIsDeterministicPerStore() {
		UUID first = LazadaScopeSupport.toTenantUuid(42L);
		UUID second = LazadaScopeSupport.toTenantUuid(42L);
		UUID other = LazadaScopeSupport.toTenantUuid(43L);

		assertThat(first).isEqualTo(second);
		assertThat(first).isNotEqualTo(other);
	}

	@Test
	void toActorUuidIsDeterministicPerUser() {
		UUID first = LazadaScopeSupport.toActorUuid(7L);
		UUID second = LazadaScopeSupport.toActorUuid(7L);
		UUID other = LazadaScopeSupport.toActorUuid(8L);

		assertThat(first).isEqualTo(second);
		assertThat(first).isNotEqualTo(other);
	}

	@Test
	void oauthStateRoundTrip() {
		String state = LazadaScopeSupport.buildOAuthState(99L);
		assertThat(LazadaScopeSupport.parseStoreIdFromState(state)).isEqualTo(99L);
	}

	@Test
	void parseStoreIdFromStateRejectsInvalidValue() {
		assertThatThrownBy(() -> LazadaScopeSupport.parseStoreIdFromState("not-valid"))
				.isInstanceOf(IllegalArgumentException.class);
	}
}
