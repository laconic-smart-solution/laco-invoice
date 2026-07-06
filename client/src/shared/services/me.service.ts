import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"
import type { MeProfile } from "@/shared/types/auth.types"

export const meService = {
  getProfile: async (): Promise<MeProfile> => {
    const response = await apiClient.get<ApiResponse<MeProfile>>("/v1/me/profile")
    return response.data.data
  },
}
