import { apiClient } from "@/app/api/client"
import type {
  LazadaAuthorizeUrl,
  LazadaConnectInput,
  LazadaConnection,
  StoreMarketplaceConnection,
} from "@/features/stores/types/store"
import type { ApiResponse } from "@/shared/types/api-response"

export const lazadaConnectionService = {
  getAuthorizeUrl: async (storeId: number) => {
    const response = await apiClient.get<ApiResponse<LazadaAuthorizeUrl>>(
      `/v1/stores/${storeId}/lazada/authorize-url`
    )
    return response.data.data
  },

  connect: async (storeId: number, payload: LazadaConnectInput) => {
    const response = await apiClient.post<ApiResponse<StoreMarketplaceConnection>>(
      `/v1/stores/${storeId}/lazada/connect`,
      {
        code: payload.code.trim(),
        displayName: payload.displayName?.trim() || undefined,
      }
    )
    return response.data.data
  },

  listConnections: async (storeId: number) => {
    const response = await apiClient.get<ApiResponse<LazadaConnection[]>>(
      `/v1/stores/${storeId}/lazada/connections`
    )
    return response.data.data ?? []
  },

  refreshConnection: async (storeId: number, externalConnectionId: string) => {
    const response = await apiClient.post<ApiResponse<StoreMarketplaceConnection>>(
      `/v1/stores/${storeId}/lazada/connections/${externalConnectionId}/refresh`
    )
    return response.data.data
  },

  revokeConnection: async (storeId: number, externalConnectionId: string) => {
    await apiClient.delete(
      `/v1/stores/${storeId}/lazada/connections/${externalConnectionId}`
    )
  },
}
