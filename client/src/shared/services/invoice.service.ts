import { apiClient } from "@/app/api/client"
import type {
  CreateInvoiceRequest,
  Invoice,
  InvoiceDetail,
  InvoiceItemLine,
  InvoiceOrderSummary,
  InvoicePaymentSummary,
  InvoicePreview,
  InvoiceStatus,
} from "@/features/invoices/types/invoice"
import type { ApiResponse } from "@/shared/types/api-response"

export interface InvoicePageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    storeId?: number
    marketplaceId?: number
    marketplaceCode?: string
    invoiceNumber?: string
    title?: string
    status?: InvoiceStatus
  }
}

interface ApiInvoiceDetail {
  invoice: Invoice
  orders: InvoiceOrderSummary[]
  items: InvoiceItemLine[]
  paymentSummary: InvoicePaymentSummary
}

export interface GeneratedNumber {
  number: string
  available: boolean
}

export const invoiceService = {
  page: async (request: InvoicePageRequest) => {
    const response = await apiClient.post<ApiResponse<Invoice[]>>(
      "/v1/invoices/pageable",
      request
    )
    return response.data
  },

  getById: async (id: number): Promise<InvoiceDetail> => {
    const response = await apiClient.get<ApiResponse<ApiInvoiceDetail>>(
      `/v1/invoices/${id}`
    )
    const detail = response.data.data
    return {
      ...detail.invoice,
      orders: detail.orders ?? [],
      items: detail.items ?? [],
      paymentSummary: detail.paymentSummary,
    }
  },

  getPaymentSummary: async (id: number) => {
    const response = await apiClient.get<ApiResponse<InvoicePaymentSummary>>(
      `/v1/invoices/${id}/payment-summary`
    )
    return response.data.data
  },

  getNextNumber: async () => {
    const response = await apiClient.get<ApiResponse<GeneratedNumber>>(
      "/v1/invoices/next-number"
    )
    return response.data.data
  },

  checkNumberAvailability: async (invoiceNumber: string, excludeId?: number) => {
    const response = await apiClient.get<ApiResponse<GeneratedNumber>>(
      "/v1/invoices/number-availability",
      { params: { invoiceNumber, excludeId } }
    )
    return response.data.data
  },

  preview: async (request: CreateInvoiceRequest) => {
    const response = await apiClient.post<ApiResponse<InvoicePreview>>(
      "/v1/invoices/preview",
      request
    )
    return response.data.data
  },

  create: async (request: CreateInvoiceRequest) => {
    const response = await apiClient.post<ApiResponse<Invoice>>(
      "/v1/invoices",
      request
    )
    return response.data.data
  },

  updateNumber: async (id: number, invoiceNumber: string) => {
    const response = await apiClient.put<ApiResponse<Invoice>>(
      `/v1/invoices/${id}/number`,
      { invoiceNumber }
    )
    return response.data.data
  },

  updateStatus: async (id: number, status: InvoiceStatus) => {
    const response = await apiClient.patch<ApiResponse<Invoice>>(
      `/v1/invoices/${id}/status`,
      { status }
    )
    return response.data.data
  },

  remove: async (id: number) => {
    await apiClient.delete<ApiResponse<void>>(`/v1/invoices/${id}`)
  },
}
