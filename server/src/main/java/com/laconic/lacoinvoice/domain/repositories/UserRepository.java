package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.User;

@Repository
public interface UserRepository extends BaseRepository<User> {

	boolean existsByEmailIgnoreCase(String email);

	Optional<User> findByEmailIgnoreCase(String email);

	Optional<User> findByAuthServerUserId(String authServerUserId);
}
