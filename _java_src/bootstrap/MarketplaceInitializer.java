package com.laconic.lacoinvoice.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;

@Component
@Order(10)
public class MarketplaceInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(MarketplaceInitializer.class);

	private static final String[][] SEED_MARKETPLACES = {
			{ "TIKTOK", "TikTok Shop" },
			{ "SHOPEE", "Shopee" },
			{ "LAZADA", "Lazada" },
			{ "AMAZON", "Amazon" }
	};

	private final MarketplaceRepository marketplaceRepository;

	public MarketplaceInitializer(MarketplaceRepository marketplaceRepository) {
		this.marketplaceRepository = marketplaceRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		for (String[] seed : SEED_MARKETPLACES) {
			String code = seed[0];
			if (marketplaceRepository.existsByCodeIgnoreCase(code)) {
				continue;
			}
			Marketplace marketplace = new Marketplace();
			marketplace.setCode(code);
			marketplace.setName(seed[1]);
			marketplaceRepository.save(marketplace);
			log.info("Marketplace seed: created code={}", code);
		}
	}
}
