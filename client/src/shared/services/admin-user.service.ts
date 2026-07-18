import { apiClient } from "@/app/api/client"
import type { AdminUser, UserPageRequest } from "@/features/users/types/user"
import type { UserRole } from "@/shared/types/auth.types"
import type { ApiResponse } from "@/shared/types/api-response"

export interface AdminUserCreateInput {
  role: UserRole
  email: string
  username: string
  password: string
  fullName: string
  active?: boolean
}

export const adminUserService = {
  pageUsers: async (request: UserPageRequest) => {
    const response = await apiClient.post<ApiResponse<AdminUser[]>>(
      "/v1/users/pageable",
      request
    )
    return response.data
  },

  getUser: async (id: number) => {
    const response = await apiClient.get<ApiResponse<AdminUser>>(`/v1/users/${id}`)
    return response.data.data
  },

  createUser: async (payload: AdminUserCreateInput) => {
    const response = await apiClient.post<ApiResponse<AdminUser>>("/v1/users", {
      role: payload.role,
      email: payload.email.trim(),
      username: payload.username.trim(),
      password: payload.password,
      fullName: payload.fullName.trim(),
      active: payload.active ?? true,
    })
    return response.data.data
  },

  verifyOtp: async (id: number) => {
    await apiClient.post<ApiResponse<null>>(`/v1/users/${id}/verify-otp`)
  },
}
