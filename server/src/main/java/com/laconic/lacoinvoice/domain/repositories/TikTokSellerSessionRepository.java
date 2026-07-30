package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.TikTokSellerSession;

@Repository
public interface TikTokSellerSessionRepository extends BaseRepository<TikTokSellerSession> {

	Optional<TikTokSellerSession> findBySellerIdIgnoreCase(String sellerId);
}
