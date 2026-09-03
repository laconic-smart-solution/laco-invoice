import { apiClient } from "@/app/api/client"
import type {
  GenerateVoucherRequest,
  Voucher,
  VoucherDetail,
  VoucherEntry,
  VoucherPageRequest,
} from "@/features/vouchers/types/voucher"
import type { ApiResponse } from "@/shared/types/api-response"

interface ApiVoucherDetail {
  voucher: Voucher
  entries: VoucherEntry[]
}

export const voucherService = {
  page: async (request: VoucherPageRequest) => {
    const response = await apiClient.post<ApiResponse<Voucher[]>>(
      "/v1/vouchers/pageable",
      request
    )
    return response.data
  },

  getById: async (id: number): Promise<VoucherDetail> => {
    const response = await apiClient.get<ApiResponse<ApiVoucherDetail>>(
      `/v1/vouchers/${id}`
    )
    const detail = response.data.data
    return {
      ...detail.voucher,
      entries: detail.entries ?? [],
    }
  },

  generate: async (request: GenerateVoucherRequest) => {
    const response = await apiClient.post<ApiResponse<Voucher>>(
      "/v1/vouchers",
      request
    )
    return response.data.data
  },

  update: async (id: number, request: GenerateVoucherRequest) => {
    const response = await apiClient.put<ApiResponse<Voucher>>(
      `/v1/vouchers/${id}`,
      request
    )
    return response.data.data
  },

  postToErp: async (id: number) => {
    const response = await apiClient.post<ApiResponse<Voucher>>(
      `/v1/vouchers/${id}/post`
    )
    return response.data.data
  },
}
