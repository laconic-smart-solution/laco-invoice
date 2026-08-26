import { apiClient } from "@/app/api/client"
import type { AdminUser, UserPageRequest } from "@/features/users/types/user"
import type { UserRole } from "@/shared/types/auth.types"
import type { ApiResponse } from "@/shared/types/api-response"
import { downloadBlob, filenameFromContentDisposition, rethrowBlobApiError } from "@/util/download-blob"

export interface AdminUserCreateInput {
  role: UserRole
  email: string
  username: string
  password: string
  fullName: string
  active?: boolean
}

export interface UserExportRequest {
  ids?: number[]
  exportAll?: boolean
  filter?: UserPageRequest["filter"]
  columns?: string[]
  pageNumber?: number
  pageSize?: number
}

export const adminUserService = {
  pageUsers: async (request: UserPageRequest) => {
    const response = await apiClient.post<ApiResponse<AdminUser[]>>(
      "/v1/users/pageable",
      request
    )
    return response.data
  },

  previewExport: async (request: UserExportRequest) => {
    const response = await apiClient.post<ApiResponse<AdminUser[]>>(
      "/v1/users/export/preview",
      {
        ...request,
        pageNumber: request.pageNumber ?? 1,
        pageSize: request.pageSize ?? 10,
      }
    )
    return response.data
  },

  exportExcel: async (request: UserExportRequest) => {
    try {
      const response = await apiClient.post<Blob>("/v1/users/export", request, {
        responseType: "blob",
      })
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        "users-export.xlsx"
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
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