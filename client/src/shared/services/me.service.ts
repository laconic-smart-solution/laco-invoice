import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"
import type { MeCredentialsRequest, MeProfile } from "@/shared/types/auth.types"

interface GetProfileOptions {
  skipAuthRefresh?: boolean
}

export const meService = {
  getProfile: async (options?: GetProfileOptions): Promise<MeProfile> => {
    const response = await apiClient.get<ApiResponse<MeProfile>>("/v1/me/profile", {
      skipAuthRefresh: options?.skipAuthRefresh,
    })
    return response.data.data
  },

  changeCredentials: async (payload: MeCredentialsRequest): Promise<MeProfile> => {
    const response = await apiClient.put<ApiResponse<MeProfile>>(
      "/v1/me/credentials",
      payload
    )
    return response.data.data
  },
}
