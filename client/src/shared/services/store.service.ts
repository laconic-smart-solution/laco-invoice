import { apiClient } from "@/app/api/client"
import type {
  Store,
  StoreCreateInput,
  StorePageRequest,
} from "@/features/stores/types/store"
import type { ApiResponse } from "@/shared/types/api-response"

export const storeService = {
  pageStores: async (request: StorePageRequest) => {
    const response = await apiClient.post<ApiResponse<Store[]>>(
      "/v1/stores/pageable",
      request
    )
    return response.data
  },

  getStore: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Store>>(`/v1/stores/${id}`)
    return response.data.data
  },

  createStore: async (payload: StoreCreateInput) => {
    const response = await apiClient.post<ApiResponse<Store>>("/v1/stores", {
      name: payload.name.trim(),
      logoUrl: payload.logoUrl?.trim() || undefined,
      active: payload.active ?? true,
    })
    return response.data.data
  },
}
