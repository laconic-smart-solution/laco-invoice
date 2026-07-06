import { apiClient } from "@/app/api/client"
import type { Marketplace } from "@/features/stores/types/store"
import type { ApiResponse } from "@/shared/types/api-response"

export const marketplaceService = {
  listMarketplaces: async () => {
    const response = await apiClient.get<ApiResponse<Marketplace[]>>("/v1/marketplaces")
    return response.data.data ?? []
  },
}
