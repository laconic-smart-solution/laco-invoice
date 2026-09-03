import { apiClient } from "@/app/api/client"
import type { ErpLookupRecord } from "@/features/vouchers/types/voucher"
import type { ApiResponse } from "@/shared/types/api-response"

export const erpLookupService = {
  items: async (search?: string) => {
    const response = await apiClient.get<ApiResponse<ErpLookupRecord[]>>(
      "/v1/erp-lookups/items",
      { params: search ? { search } : undefined }
    )
    return response.data.data ?? []
  },

  accounts: async (search?: string) => {
    const response = await apiClient.get<ApiResponse<ErpLookupRecord[]>>(
      "/v1/erp-lookups/account-codes",
      { params: search ? { search } : undefined }
    )
    return response.data.data ?? []
  },

  vendors: async (search?: string) => {
    const response = await apiClient.get<ApiResponse<ErpLookupRecord[]>>(
      "/v1/erp-lookups/vendors",
      { params: search ? { search } : undefined }
    )
    return response.data.data ?? []
  },

  departments: async (search?: string) => {
    const response = await apiClient.get<ApiResponse<ErpLookupRecord[]>>(
      "/v1/erp-lookups/departments",
      { params: search ? { search } : undefined }
    )
    return response.data.data ?? []
  },

  currencies: async (search?: string) => {
    const response = await apiClient.get<ApiResponse<ErpLookupRecord[]>>(
      "/v1/erp-lookups/currencies",
      { params: search ? { search } : undefined }
    )
    return response.data.data ?? []
  },
}
