import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CreateInvoiceRequest,
  InvoiceStatus,
} from "@/features/invoices/types/invoice"
import type { InvoicePageRequest } from "@/shared/services/invoice.service"
import { invoiceService } from "@/shared/services/invoice.service"

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (request: InvoicePageRequest) =>
    [...invoiceKeys.lists(), request] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  nextNumber: () => [...invoiceKeys.all, "next-number"] as const,
  preview: (request: CreateInvoiceRequest | null) =>
    [...invoiceKeys.all, "preview", request] as const,
}

const LIST_PAGE_REQUEST: InvoicePageRequest = {
  pageNumber: 1,
  pageSize: 200,
  sortBy: "createdAt",
  sortOrder: "DESC",
}

export function useInvoicesQuery(request: InvoicePageRequest = LIST_PAGE_REQUEST) {
  return useQuery({
    queryKey: invoiceKeys.list(request),
    queryFn: async () => (await invoiceService.page(request)).data ?? [],
    staleTime: 30_000,
  })
}

export function useInvoiceDetailQuery(id: number | null) {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? 0),
    queryFn: () => invoiceService.getById(id as number),
    enabled: id != null && id > 0,
  })
}

export function useNextInvoiceNumberQuery(enabled: boolean) {
  return useQuery({
    queryKey: invoiceKeys.nextNumber(),
    queryFn: () => invoiceService.getNextNumber(),
    enabled,
    staleTime: 0,
    gcTime: 0,
  })
}

/** Live aggregation/VAT totals for the create dialog; skipped until the form is valid. */
export function useInvoicePreviewQuery(request: CreateInvoiceRequest | null) {
  return useQuery({
    queryKey: invoiceKeys.preview(request),
    queryFn: () => invoiceService.preview(request as CreateInvoiceRequest),
    enabled: request != null,
    staleTime: 30_000,
  })
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateInvoiceRequest) => invoiceService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export function useUpdateInvoiceNumberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, invoiceNumber }: { id: number; invoiceNumber: string }) =>
      invoiceService.updateNumber(id, invoiceNumber),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.id),
      })
    },
  })
}

export function useUpdateInvoiceStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: InvoiceStatus }) =>
      invoiceService.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => invoiceService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}
