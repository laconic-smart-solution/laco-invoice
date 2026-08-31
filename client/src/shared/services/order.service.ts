import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"
import { downloadBlob, filenameFromContentDisposition, rethrowBlobApiError } from "@/util/download-blob"

export type ApiOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

export type ApiOrderSourceType = "API" | "IMPORT"

export interface ApiOrderDto {
  id: number
  storeId: number
  storeName: string | null
  marketplaceId: number
  marketplaceCode: string
  customerId: number | null
  customerName: string | null
  customerPhone: string | null
  externalOrderId: string
  orderStatus: ApiOrderStatus
  sourceType: ApiOrderSourceType | null
  subtotal: number
  shippingFee: number
  amountExVat: number | null
  vatAmount: number | null
  totalAmount: number
  totalFees: number
  totalAdsFee: number
  currency: string | null
  orderDate: string | null
  createdAt: string
}

export interface ApiCustomerInfoDto {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  gender: string | null
  address: string | null
}

export interface ApiOrderItemDto {
  id: number
  productId: number | null
  sku: string | null
  productName: string | null
  price: number
  quantity: number
  lineTotal: number
}

export interface ApiOrderDetailDto {
  order: ApiOrderDto
  customer: ApiCustomerInfoDto | null
  items: ApiOrderItemDto[]
}

export type ApiOrderHistoryAction = "CREATE" | "UPDATE" | "DELETE"
export type ApiOrderHistorySource = "MANUAL" | "IMPORT_EXCEL"

export interface ApiOrderHistoryChangeDto {
  field: string
  fieldLabelKey: string | null
  before: string | null
  after: string | null
  valueType: string
}

export interface ApiOrderHistoryEventDto {
  id: number
  action: ApiOrderHistoryAction
  source: ApiOrderHistorySource
  updatedByUserId: number | null
  updatedBy: string | null
  updatedAt: string
  importFileId: number | null
  excelFileName: string | null
  note: string | null
  changes: ApiOrderHistoryChangeDto[]
}

export interface OrderPageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    orderStatus?: ApiOrderStatus
    sourceType?: ApiOrderSourceType
    sourceId?: number
    externalOrderId?: string
    storeId?: number
    marketplaceId?: number
    marketplaceCode?: string
  }
}

export type ApiOrderImportStatus = "COMPLETED" | "FAILED" | "PARTIAL"

export interface ApiOrderImportResultDto {
  importFileId: number | null
  sheetName: string | null
  rowCount: number
  orderCount: number
  itemCount: number
  status: ApiOrderImportStatus
  errors: string[]
}

export interface OrderImportRequest {
  storeId: number
  marketplaceCode: string
  file: File
}

export type ApiOrderImportMatchStatus = "NEW" | "DUPLICATE"
export type ApiOrderImportResolveAction = "CREATE" | "MERGE" | "SKIP" | "REPLACE"
export type ApiOrderImportBatchStatus =
  | "PREVIEW"
  | "COMMITTED"
  | "EXPIRED"
  | "CANCELLED"

export interface ApiOrderImportPreviewOrderDto {
  id: number
  externalOrderId: string
  matchStatus: ApiOrderImportMatchStatus
  existingOrderId: number | null
  resolveAction: ApiOrderImportResolveAction | null
  resolveSource: string | null
  excelItemCount: number | null
  existingItemCount: number | null
  excelTotalAmount: number | null
  existingTotalAmount: number | null
  warningCode: string | null
}

export interface ApiOrderImportPreviewBatchDto {
  batchId: number
  status: ApiOrderImportBatchStatus
  sheetName: string | null
  originalFilename: string | null
  rowCount: number
  totalOrders: number
  newCount: number
  duplicateCount: number
  expiresAt: string | null
  orders: ApiOrderImportPreviewOrderDto[]
}

export interface ApiOrderImportPreviewExcelRowDto {
  excelRowIndex: number | null
  values: Record<string, string>
}

export interface ApiOrderImportPreviewExcelRowsDto {
  previewOrderId: number
  externalOrderId: string
  columns: string[]
  rows: ApiOrderImportPreviewExcelRowDto[]
}

export interface OrderImportDecideUpdate {
  previewOrderId: number
  resolveAction: ApiOrderImportResolveAction
}

export interface OrderImportDecideRequest {
  storeId: number
  batchId: number
  bulkDuplicatesAction?: ApiOrderImportResolveAction
  updates?: OrderImportDecideUpdate[]
}

export interface OrderImportCommitRequest {
  storeId: number
  batchId: number
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  totalFees: number
  totalAdsFee: number
  totalAdjustments?: number
}

export interface OrderExportRequest {
  ids?: number[]
  exportAll?: boolean
  filter?: {
    storeId?: number
    orderStatus?: ApiOrderStatus
    sourceType?: ApiOrderSourceType
    sourceId?: number
    externalOrderId?: string
  }
  columns?: string[]
  pageNumber?: number
  pageSize?: number
}

export const orderService = {
  pageOrders: async (request: OrderPageRequest) => {
    const response = await apiClient.post<ApiResponse<ApiOrderDto[]>>(
      "/v1/orders/pageable",
      request
    )
    return response.data
  },

  previewExport: async (request: OrderExportRequest) => {
    const response = await apiClient.post<ApiResponse<ApiOrderDto[]>>(
      "/v1/orders/export/preview",
      {
        ...request,
        pageNumber: request.pageNumber ?? 1,
        pageSize: request.pageSize ?? 10,
      }
    )
    return response.data
  },

  getOrder: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ApiOrderDetailDto>>(
      `/v1/orders/${id}`
    )
    return response.data.data
  },

  pageOrderHistory: async (
    orderId: number,
    pageNumber = 1,
    pageSize = 10
  ) => {
    const response = await apiClient.get<ApiResponse<ApiOrderHistoryEventDto[]>>(
      `/v1/orders/${orderId}/history`,
      { params: { pageNumber, pageSize } }
    )
    return response.data
  },

  getStats: async (storeId?: number): Promise<OrderStats> => {
    const response = await apiClient.get<ApiResponse<OrderStats>>("/v1/orders/stats", {
      params: storeId != null ? { storeId } : undefined,
    })
    const data = response.data.data
    return {
      totalOrders: data?.totalOrders ?? 0,
      totalRevenue: Number(data?.totalRevenue ?? 0),
      totalFees: Number(data?.totalFees ?? 0),
      totalAdsFee: Number((data as any)?.totalAdsFee ?? (data as any)?.totalAdjustments ?? 0),
    }
  },

  triggerSync: async () => {
    await apiClient.post("/v1/orders/sync")
  },

  importExcel: async ({ storeId, marketplaceCode, file }: OrderImportRequest) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiClient.post<ApiResponse<ApiOrderImportResultDto>>(
      "/v1/orders/import",
      formData,
      {
        params: { storeId, marketplaceCode },
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data.data
  },

  previewImport: async ({ storeId, marketplaceCode, file }: OrderImportRequest) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiClient.post<ApiResponse<ApiOrderImportPreviewBatchDto>>(
      "/v1/orders/import/preview",
      formData,
      {
        params: { storeId, marketplaceCode },
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data.data
  },

  decideImportPreview: async ({
    storeId,
    batchId,
    bulkDuplicatesAction,
    updates,
  }: OrderImportDecideRequest) => {
    const response = await apiClient.patch<ApiResponse<ApiOrderImportPreviewBatchDto>>(
      `/v1/orders/import/preview/${batchId}/orders`,
      {
        bulkDuplicatesAction,
        updates,
      },
      { params: { storeId } }
    )
    return response.data.data
  },

  getImportPreviewExcelRows: async ({
    storeId,
    batchId,
    previewOrderId,
  }: {
    storeId: number
    batchId: number
    previewOrderId: number
  }) => {
    const response = await apiClient.get<ApiResponse<ApiOrderImportPreviewExcelRowsDto>>(
      `/v1/orders/import/preview/${batchId}/orders/${previewOrderId}/excel-rows`,
      { params: { storeId } }
    )
    return response.data.data
  },

  commitImportPreview: async ({ storeId, batchId }: OrderImportCommitRequest) => {
    const response = await apiClient.post<ApiResponse<ApiOrderImportResultDto>>(
      `/v1/orders/import/preview/${batchId}/commit`,
      null,
      { params: { storeId } }
    )
    return response.data.data
  },

  exportExcel: async (request: OrderExportRequest) => {
    try {
      const response = await apiClient.post<Blob>("/v1/orders/export", request, {
        responseType: "blob",
      })
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        "orders-export.xlsx"
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },
}
