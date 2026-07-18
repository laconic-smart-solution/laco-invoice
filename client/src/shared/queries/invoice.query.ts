import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { InvoicePageRequest } from "@/features/invoices/types/invoice"
import { invoiceService } from "@/shared/services/invoice.service"
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
}

export function useInvoicesPageQuery(request: InvoicePageRequest) {
  return useQuery({
    queryKey: invoiceKeys.list(request),
    queryFn: () => invoiceService.pageInvoices(request),
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
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
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
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useDownloadInvoicePdfMutation() {
  return useMutation({
    mutationFn: ({ id, filename }: { id: number; filename?: string }) =>
      invoiceService.downloadPdf(id, filename),
  })
}

export function getInvoiceErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}
