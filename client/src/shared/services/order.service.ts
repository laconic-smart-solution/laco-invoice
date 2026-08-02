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
  invoiceId: number | null
  externalOrderId: string
  orderStatus: ApiOrderStatus
  sourceType: ApiOrderSourceType | null
  subtotal: number
  shippingFee: number
  amountExVat: number | null
  vatAmount: number | null
  totalAmount: number
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

export interface OrderPageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    orderStatus?: ApiOrderStatus
    sourceType?: ApiOrderSourceType
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

export interface OrderStats {
  totalOrders: number
  invoicedOrders: number
  awaitingInvoice: number
  invoiceCoveragePercent: number
}

export interface OrderExportRequest {
  ids?: number[]
  exportAll?: boolean
  filter?: {
    storeId?: number
    orderStatus?: ApiOrderStatus
    sourceType?: ApiOrderSourceType
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

  getStats: async (storeId?: number): Promise<OrderStats> => {
    const response = await apiClient.get<ApiResponse<OrderStats>>("/v1/orders/stats", {
      params: storeId != null ? { storeId } : undefined,
    })
    const data = response.data.data
    return {
      totalOrders: data?.totalOrders ?? 0,
      invoicedOrders: data?.invoicedOrders ?? 0,
      awaitingInvoice: data?.awaitingInvoice ?? 0,
      invoiceCoveragePercent: data?.invoiceCoveragePercent ?? 0,
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

  bulkGenerateZip: async (request: OrderExportRequest) => {
    try {
      const response = await apiClient.post<Blob>("/v1/orders/bulk-generate", request, {
        responseType: "blob",
      })
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        "orders-invoices.zip"
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },
}
