import { apiClient } from "@/app/api/client"
import type {
  CreateVoucherRequest,
  PaymentMethod,
  PaymentVoucher,
  VoucherStatus,
} from "@/features/invoices/types/voucher"
import type { GeneratedNumber } from "@/shared/services/invoice.service"
import type { ApiResponse } from "@/shared/types/api-response"

export interface PaymentVoucherPageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    storeId?: number
    voucherNumber?: string
    customerName?: string
    paymentMethod?: PaymentMethod
    status?: VoucherStatus
  }
}

export const paymentVoucherService = {
  page: async (request: PaymentVoucherPageRequest) => {
    const response = await apiClient.post<ApiResponse<PaymentVoucher[]>>(
      "/v1/payment-vouchers/pageable",
      request
    )
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<PaymentVoucher>>(
      `/v1/payment-vouchers/${id}`
    )
    return response.data.data
  },

  listByInvoice: async (invoiceId: number) => {
    const response = await apiClient.get<ApiResponse<PaymentVoucher[]>>(
      `/v1/payment-vouchers/by-invoice/${invoiceId}`
    )
    return response.data.data ?? []
  },

  getNextNumber: async () => {
    const response = await apiClient.get<ApiResponse<GeneratedNumber>>(
      "/v1/payment-vouchers/next-number"
    )
    return response.data.data
  },

  checkNumberAvailability: async (voucherNumber: string, excludeId?: number) => {
    const response = await apiClient.get<ApiResponse<GeneratedNumber>>(
      "/v1/payment-vouchers/number-availability",
      { params: { voucherNumber, excludeId } }
    )
    return response.data.data
  },

  create: async (request: CreateVoucherRequest) => {
    const response = await apiClient.post<ApiResponse<PaymentVoucher>>(
      "/v1/payment-vouchers",
      request
    )
    return response.data.data
  },

  remove: async (id: number) => {
    await apiClient.delete<ApiResponse<void>>(`/v1/payment-vouchers/${id}`)
  },
}
