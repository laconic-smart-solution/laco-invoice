package com.laconic.lacoinvoice.domain.repositories;

import org.springframework.stereotype.Repository;

import com.laconic.lacoinvoice.common.persistence.BaseRepository;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;

@Repository
public interface OrderImportFileRepository extends BaseRepository<OrderImportFile> {
}
