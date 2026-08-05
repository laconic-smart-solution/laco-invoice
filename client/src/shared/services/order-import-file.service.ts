import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"

export type ApiOrderImportFileStatus = "COMPLETED" | "FAILED" | "PARTIAL"

export interface ApiOrderImportFileDto {
  id: number
  storeId: number | null
  storeName: string | null
  marketplaceId: number | null
  marketplaceCode: string | null
  originalFilename: string
  sheetName: string | null
  rowCount: number | null
  importedOrders: number | null
  importedItems: number | null
  status: ApiOrderImportFileStatus
  createdAt: string
  updatedAt: string
}

export interface OrderImportFilePageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    storeId?: number
    marketplaceId?: number
    marketplaceCode?: string
    status?: ApiOrderImportFileStatus
    originalFilename?: string
  }
}

export const orderImportFileService = {
  page: async (request: OrderImportFilePageRequest) => {
    const response = await apiClient.post<ApiResponse<ApiOrderImportFileDto[]>>(
      "/v1/order-import-files/pageable",
      request
    )
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ApiOrderImportFileDto>>(
      `/v1/order-import-files/${id}`
    )
    return response.data.data
  },
}
