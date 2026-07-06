package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.Product;

@Repository
public interface ProductRepository extends BaseRepository<Product> {

	Optional<Product> findByStore_IdAndSkuIgnoreCase(Long storeId, String sku);

	boolean existsByStore_IdAndSkuIgnoreCase(Long storeId, String sku);

	boolean existsByStore_IdAndSkuIgnoreCaseAndIdNot(Long storeId, String sku, Long id);
}
