import { apiClient } from "@/app/api/client"
import type {
  GenerateVoucherRequest,
  Voucher,
  VoucherDetail,
  VoucherEntry,
  VoucherExportRequest,
  VoucherPageRequest,
  VoucherPreviewDto,
  VoucherPreviewRequest,
} from "@/features/vouchers/types/voucher"
import type { ApiResponse } from "@/shared/types/api-response"
import {
  downloadBlob,
  filenameFromContentDisposition,
  rethrowBlobApiError,
} from "@/util/download-blob"

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

  previewFromOrderInput: async (
    request: VoucherPreviewRequest
  ): Promise<VoucherPreviewDto> => {
    const response = await apiClient.post<ApiResponse<VoucherPreviewDto>>(
      "/v1/vouchers/preview-from-order-input",
      request
    )
    return response.data.data
  },

  getByOrderInputRun: async (runId: number): Promise<Voucher[]> => {
    const response = await apiClient.get<ApiResponse<Voucher[]>>(
      `/v1/vouchers/by-order-input-run/${runId}`
    )
    return response.data.data ?? []
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

  exportExcel: async (request: VoucherExportRequest) => {
    try {
      const response = await apiClient.post<Blob>(
        "/v1/vouchers/export/excel",
        request,
        {
          responseType: "blob",
        }
      )
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        "vouchers-export.xlsx"
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },

  exportCsv: async (request: VoucherExportRequest) => {
    try {
      const response = await apiClient.post<Blob>(
        "/v1/vouchers/export/csv",
        request,
        {
          responseType: "blob",
        }
      )
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        "vouchers-export.csv"
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },

  exportSingleExcel: async (id: number, voucherNumber?: string) => {
    try {
      const response = await apiClient.get<Blob>(
        `/v1/vouchers/${id}/export/excel`,
        {
          responseType: "blob",
        }
      )
      const fallback = voucherNumber
        ? `voucher-${voucherNumber.replace(/[^a-zA-Z0-9.-]/g, "_")}.xlsx`
        : `voucher-${id}.xlsx`
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        fallback
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },

  exportSingleCsv: async (id: number, voucherNumber?: string) => {
    try {
      const response = await apiClient.get<Blob>(
        `/v1/vouchers/${id}/export/csv`,
        {
          responseType: "blob",
        }
      )
      const fallback = voucherNumber
        ? `voucher-${voucherNumber.replace(/[^a-zA-Z0-9.-]/g, "_")}.csv`
        : `voucher-${id}.csv`
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        fallback
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },

  exportPdf: async (request: VoucherExportRequest) => {
    try {
      const response = await apiClient.post<Blob>(
        "/v1/vouchers/export/pdf",
        request,
        {
          responseType: "blob",
        }
      )
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        "vouchers-export.pdf"
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },

  exportSinglePdf: async (id: number, voucherNumber?: string) => {
    try {
      const response = await apiClient.get<Blob>(
        `/v1/vouchers/${id}/export/pdf`,
        {
          responseType: "blob",
        }
      )
      const fallback = voucherNumber
        ? `voucher-${voucherNumber.replace(/[^a-zA-Z0-9.-]/g, "_")}.pdf`
        : `voucher-${id}.pdf`
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        fallback
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },
}

