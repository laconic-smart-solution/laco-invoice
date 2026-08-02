import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { InvoicePageRequest } from "@/features/invoices/types/invoice"
import {
  invoiceService,
  type InvoiceExportRequest,
} from "@/shared/services/invoice.service"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"
import { orderKeys } from "@/shared/queries/order.query"

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (request: InvoicePageRequest) =>
    [...invoiceKeys.lists(), request] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  stats: (storeId?: number) => [...invoiceKeys.all, "stats", storeId ?? "all"] as const,
  exportPreview: (request: Omit<InvoiceExportRequest, "pageNumber" | "pageSize" | "columns">) =>
    [...invoiceKeys.all, "export-preview", request] as const,
}

export function useInvoicesPageQuery(request: InvoicePageRequest) {
  return useQuery({
    queryKey: invoiceKeys.list(request),
    queryFn: () => invoiceService.pageInvoices(request),
  })
}

export function useInvoiceStatsQuery(storeId?: number) {
  return useQuery({
    queryKey: invoiceKeys.stats(storeId),
    queryFn: () => invoiceService.getStats(storeId),
  })
}

export function useInvoiceDetailQuery(id: number | null) {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? 0),
    queryFn: () => invoiceService.getInvoice(id as number),
    enabled: id != null && id > 0,
  })
}

export function useGenerateInvoiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => invoiceService.generateForOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderKeys.details() })
    },
  })
}

export function useVoidInvoiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => invoiceService.voidInvoice(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export function useDownloadInvoicePdfMutation() {
  return useMutation({
    mutationFn: ({ id, filename }: { id: number; filename?: string }) =>
      invoiceService.downloadPdf(id, filename),
  })
}

export function usePrintInvoicePdfMutation() {
  return useMutation({
    mutationFn: (id: number) => invoiceService.printPdf(id),
  })
}

export function useInvoiceExportPreviewQuery(
  request: Omit<InvoiceExportRequest, "pageNumber" | "pageSize" | "columns">,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: invoiceKeys.exportPreview(request),
    queryFn: ({ pageParam }) =>
      invoiceService.previewExport({
        ...request,
        pageNumber: pageParam,
        pageSize: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta?.page ?? 1
      const totalPages = lastPage.meta?.totalPages ?? 0
      if (page >= totalPages) {
        return undefined
      }
      return page + 1
    },
    enabled,
  })
}

export function useExportInvoicesMutation() {
  return useMutation({
    mutationFn: (request: InvoiceExportRequest) => invoiceService.exportExcel(request),
  })
}

export function useBulkDownloadInvoicesMutation() {
  return useMutation({
    mutationFn: (request: InvoiceExportRequest) =>
      invoiceService.bulkDownloadPdf(request),
  })
}

export function getInvoiceErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}
