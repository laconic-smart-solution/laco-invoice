import type {
  MarketplaceCode,
  MarketplaceConfig,
} from "@/features/stores/config/marketplaces"
import { getMarketplaceConfig } from "@/features/stores/config/marketplaces"
import type {
  MarketplaceAuthorizeUrl,
  MarketplaceConnectInput,
  MarketplaceConnection,
  StoreMarketplaceConnection,
} from "@/features/stores/types/store"
import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"

function apiPath(storeId: number, marketplace: MarketplaceCode, suffix: string): string {
  const segment = getMarketplaceConfig(marketplace).routeSegment
  return `/v1/stores/${storeId}/${segment}${suffix}`
}

export function createMarketplaceConnectionService(marketplace: MarketplaceCode) {
  return {
    marketplace,
    getAuthorizeUrl: async (storeId: number) => {
      const response = await apiClient.get<ApiResponse<MarketplaceAuthorizeUrl>>(
        apiPath(storeId, marketplace, "/authorize-url")
      )
      return response.data.data
    },
    connect: async (storeId: number, payload: MarketplaceConnectInput) => {
      const response = await apiClient.post<ApiResponse<StoreMarketplaceConnection>>(
        apiPath(storeId, marketplace, "/connect"),
        {
          code: payload.code.trim(),
          displayName: payload.displayName?.trim() || undefined,
          shopId: payload.shopId?.trim() || undefined,
        }
      )
      return response.data.data
    },
    listConnections: async (storeId: number) => {
      const response = await apiClient.get<ApiResponse<MarketplaceConnection[]>>(
        apiPath(storeId, marketplace, "/connections")
      )
      return response.data.data ?? []
    },
    refreshConnection: async (storeId: number, externalConnectionId: string) => {
      const response = await apiClient.post<ApiResponse<StoreMarketplaceConnection>>(
        apiPath(storeId, marketplace, `/connections/${externalConnectionId}/refresh`)
      )
      return response.data.data
    },
    revokeConnection: async (storeId: number, externalConnectionId: string) => {
      await apiClient.delete(
        apiPath(storeId, marketplace, `/connections/${externalConnectionId}`)
      )
    },
  }
}

const marketplaceServices = new Map<MarketplaceCode, ReturnType<typeof createMarketplaceConnectionService>>()

export function getMarketplaceConnectionService(marketplace: MarketplaceCode) {
  let service = marketplaceServices.get(marketplace)
  if (!service) {
    service = createMarketplaceConnectionService(marketplace)
    marketplaceServices.set(marketplace, service)
  }
  return service
}

export function getMarketplaceConnectionServiceByConfig(config: MarketplaceConfig) {
  return getMarketplaceConnectionService(config.code)
}
