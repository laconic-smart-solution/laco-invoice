package com.laconic.lacoinvoice.features.tiktokscrape;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.domain.models.TikTokSellerSession;
import com.laconic.lacoinvoice.domain.repositories.TikTokSellerSessionRepository;

@Service
public class TikTokSellerSessionService {

	private final TikTokSellerSessionRepository repository;

	public TikTokSellerSessionService(TikTokSellerSessionRepository repository) {
		this.repository = repository;
	}

	@Transactional
	public TikTokSellerSessionDto upsert(TikTokSellerSessionUpsertRequest request) {
		String sellerId = request.getSellerId().trim();
		TikTokSellerSession entity = repository.findBySellerIdIgnoreCase(sellerId)
				.orElseGet(TikTokSellerSession::new);
		entity.setSellerId(sellerId);
		entity.setStorageStateJson(request.getStorageStateJson().trim());
		if (StringUtils.hasText(request.getDisplayName())) {
			entity.setDisplayName(request.getDisplayName().trim());
		}
		entity.setEnable(true);
		return toDto(repository.save(entity), true);
	}

	@Transactional(readOnly = true)
	public TikTokSellerSessionDto getBySellerId(String sellerId, boolean includeStorageState) {
		TikTokSellerSession entity = repository.findBySellerIdIgnoreCase(sellerId.trim())
				.orElseThrow(() -> new ResourceNotFoundException(
						"TikTok seller session not found: sellerId=" + sellerId));
		return toDto(entity, includeStorageState);
	}

	@Transactional(readOnly = true)
	public List<TikTokSellerSessionDto> list(boolean includeStorageState) {
		return repository.findAll().stream()
				.map(entity -> toDto(entity, includeStorageState))
				.toList();
	}

	private static TikTokSellerSessionDto toDto(TikTokSellerSession entity, boolean includeStorageState) {
		return new TikTokSellerSessionDto(
				entity.getId(),
				entity.getSellerId(),
				entity.getDisplayName(),
				includeStorageState ? entity.getStorageStateJson() : null,
				entity.getUpdatedAt());
	}
}
