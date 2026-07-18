package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;

@Repository
public interface CustomerInfoRepository extends BaseRepository<CustomerInfo> {

	Optional<CustomerInfo> findFirstByStore_IdAndMarketplace_IdAndExternalCustomerId(
			Long storeId,
			Long marketplaceId,
			String externalCustomerId);

	Optional<CustomerInfo> findFirstByStore_IdAndMarketplace_IdAndPhoneIgnoreCase(
			Long storeId,
			Long marketplaceId,
			String phone);

	/** Legacy rows created before marketplace binding (marketplace_id null). */
	Optional<CustomerInfo> findFirstByStore_IdAndPhoneIgnoreCaseAndMarketplaceIsNull(
			Long storeId,
			String phone);
}
