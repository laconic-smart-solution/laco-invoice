package com.laconic.lacoinvoice.features.marketplace;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;

@Service
public class MarketplaceServiceImpl implements MarketplaceService {

	private final MarketplaceRepository repository;
	private final MarketplaceMapper mapper;

	public MarketplaceServiceImpl(MarketplaceRepository repository, MarketplaceMapper mapper) {
		this.repository = repository;
		this.mapper = mapper;
	}

	@Override
	@Transactional(readOnly = true)
	public List<MarketplaceDto> getAll() {
		return repository.findAll().stream().map(mapper::toDto).toList();
	}
}
