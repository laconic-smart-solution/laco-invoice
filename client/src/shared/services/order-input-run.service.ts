import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"
import type {
  ApiOrderImportPreviewBatchDto,
  ApiOrderImportResultDto,
} from "@/shared/services/order.service"

export type ApiOrderInputRunStatus =
  | "DRAFT"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"

export type ApiOrderInputFileStatus =
  | "MISSING"
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "PARTIAL"

export type ApiOrderWithdrawMatchStatus = "MATCHED" | "UNMATCHED" | "INVALID"
export type ApiOrderWithdrawApplyStatus =
  | "PENDING"
  | "APPLIED"
  | "SKIPPED"
  | "FAILED"

export interface ApiOrderInputRunDto {
  id: number
  storeId: number | null
  storeName: string | null
  marketplaceId: number | null
  marketplaceCode: string | null
  title: string
  status: ApiOrderInputRunStatus
  orderDetailFilename: string | null
  orderDetailSize: number | null
  orderDetailStatus: ApiOrderInputFileStatus
  orderDetailError: string | null
  orderDetailStartedAt: string | null
  orderDetailFinishedAt: string | null
  orderDetailBatchId: number | null
  orderDetailImportFileId: number | null
  withdrawFilename: string | null
  withdrawSize: number | null
  withdrawStatus: ApiOrderInputFileStatus
  withdrawError: string | null
  withdrawStartedAt: string | null
  withdrawFinishedAt: string | null
  withdrawRowCount: number | null
  withdrawMatchedCount: number | null
  withdrawUnmatchedCount: number | null
  orderCount: number | null
  itemCount: number | null
  createdAt: string
  updatedAt: string
}

export interface ApiOrderWithdrawImportRowDto {
  id: number
  excelRowIndex: number | null
  externalOrderId: string | null
  orderId: number | null
  withdrawAmount: number | null
  totalFees: number | null
  adjustmentAmount: number | null
  currency: string | null
  withdrawAt: string | null
  matchStatus: ApiOrderWithdrawMatchStatus
  applyStatus: ApiOrderWithdrawApplyStatus
  errorMessage: string | null
}

export interface OrderInputRunPageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    storeId?: number
    marketplaceId?: number
    marketplaceCode?: string
    title?: string
    status?: ApiOrderInputRunStatus
  }
}

export interface OrderInputRunCreateRequest {
  title: string
  storeId: number
  marketplaceCode: string
}

export const orderInputRunService = {
  page: async (request: OrderInputRunPageRequest) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto[]>>(
      "/v1/order-input-runs/pageable",
      request
    )
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}`
    )
    return response.data.data
  },

    updateTitle: async (id: number, title: string) => {
    const response = await apiClient.put<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/title`,
      { title }
    )
    return response.data.data
  },

  create: async (request: OrderInputRunCreateRequest) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      "/v1/order-input-runs",
      request
    )
    return response.data.data
  },

  uploadOrderDetail: async (id: number, file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/files/order-detail`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    return response.data.data
  },

  uploadWithdraw: async (id: number, file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/files/withdraw`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    return response.data.data
  },

  startRunPreview: async (id: number) => {
    const response = await apiClient.post<ApiResponse<ApiOrderImportPreviewBatchDto>>(
      `/v1/order-input-runs/${id}/run/preview`
    )
    return response.data.data
  },

  cancelRunPreview: async (id: number) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/run/cancel-preview`
    )
    return response.data.data
  },

  resetStuck: async (id: number) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/run/reset-stuck`
    )
    return response.data.data
  },

  finishRun: async (id: number, importResult: ApiOrderImportResultDto) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/run/finish`,
      importResult
    )
    return response.data.data
  },

  runWithdraw: async (id: number) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/run/withdraw`
    )
    return response.data.data
  },

  deleteSet: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/v1/order-input-runs/${id}`)
  },

  rollbackOrderDetail: async (id: number) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/rollback/order-detail`
    )
    return response.data.data
  },

  rollbackWithdraw: async (id: number) => {
    const response = await apiClient.post<ApiResponse<ApiOrderInputRunDto>>(
      `/v1/order-input-runs/${id}/rollback/withdraw`
    )
    return response.data.data
  },

  pageWithdrawRows: async (
    id: number,
    pageNumber = 1,
    pageSize = 20,
    filter?: {
      externalOrderId?: string
      matchStatus?: string
      applyStatus?: string
      sortBy?: string
      sortOrder?: "ASC" | "DESC"
    }
  ) => {
    const response = await apiClient.get<
      ApiResponse<ApiOrderWithdrawImportRowDto[]>
    >(`/v1/order-input-runs/${id}/withdraw-rows`, {
      params: {
        pageNumber,
        pageSize,
        sortBy: filter?.sortBy ?? "excelRowIndex",
        sortOrder: filter?.sortOrder ?? "ASC",
        ...(filter?.externalOrderId
          ? { externalOrderId: filter.externalOrderId }
          : {}),
        ...(filter?.matchStatus && filter.matchStatus !== "all"
          ? { matchStatus: filter.matchStatus }
          : {}),
        ...(filter?.applyStatus && filter.applyStatus !== "all"
          ? { applyStatus: filter.applyStatus }
          : {}),
      },
    })
    return response.data
  },
}

