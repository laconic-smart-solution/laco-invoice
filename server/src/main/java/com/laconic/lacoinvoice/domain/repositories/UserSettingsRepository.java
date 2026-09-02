package com.laconic.lacoinvoice.domain.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.laconic.lacoinvoice.domain.models.UserSettings;

public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {

	Optional<UserSettings> findByUser_Id(Long userId);
}
