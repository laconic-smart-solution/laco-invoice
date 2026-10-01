package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

@Repository
public interface StoreMarketplaceConnectionRepository extends BaseRepository<StoreMarketplaceConnection> {

	List<StoreMarketplaceConnection> findByStore_Id(Long storeId);

	Optional<StoreMarketplaceConnection> findByStore_IdAndExternalConnectionId(
			Long storeId,
			UUID externalConnectionId);

	Optional<StoreMarketplaceConnection> findByStore_IdAndMarketplace_CodeIgnoreCase(
			Long storeId,
			String marketplaceCode);
}
