package com.laconic.lacoinvoice.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.domain.models.Store;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long>, JpaSpecificationExecutor<Store> {

	boolean existsByIdAndOwner_Id(Long storeId, Long ownerId);

	List<Store> findByOwner_Id(Long ownerId);

	List<Store> findByActiveTrue();

	boolean existsByOwner_IdAndNameIgnoreCase(Long ownerId, String name);
}
