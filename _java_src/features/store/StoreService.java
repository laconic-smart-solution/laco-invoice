package com.laconic.lacoinvoice.features.store;

import java.util.List;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.store.StoreCommands.CreateRequest;
import com.laconic.lacoinvoice.features.store.StoreCommands.MarketplaceConnectionCreateRequest;
import com.laconic.lacoinvoice.features.store.StoreCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.store.pageable.StorePageRequest;

public interface StoreService extends BaseService<StoreDto, CreateRequest, UpdateRequest> {

	ApiResponse<List<StoreDto>> page(StorePageRequest request);

	StoreMarketplaceConnectionDto createMarketplaceConnection(Long storeId, MarketplaceConnectionCreateRequest request);

	List<StoreMarketplaceConnectionDto> listMarketplaceConnections(Long storeId);
}
