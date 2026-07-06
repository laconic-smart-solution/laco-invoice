package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.ProductErpMapping;

@Repository
public interface ProductErpMappingRepository extends BaseRepository<ProductErpMapping> {

	List<ProductErpMapping> findByProduct_Id(Long productId);

	Optional<ProductErpMapping> findByProduct_IdAndId(Long productId, Long id);

	boolean existsByProduct_Id(Long productId);
}
