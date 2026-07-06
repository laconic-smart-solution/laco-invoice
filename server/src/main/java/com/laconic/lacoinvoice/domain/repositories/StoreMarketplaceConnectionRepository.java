package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.StoreMarketplaceConnection;

@Repository
public interface StoreMarketplaceConnectionRepository extends BaseRepository<StoreMarketplaceConnection> {

	List<StoreMarketplaceConnection> findByStore_Id(Long storeId);
}
