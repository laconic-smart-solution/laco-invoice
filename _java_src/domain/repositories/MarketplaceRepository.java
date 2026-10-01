package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.Marketplace;

@Repository
public interface MarketplaceRepository extends BaseRepository<Marketplace> {

	Optional<Marketplace> findByCodeIgnoreCase(String code);

	boolean existsByCodeIgnoreCase(String code);
}
