import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invoiceKeys } from "@/features/invoices/queries/invoice.query"
import type { CreateVoucherRequest } from "@/features/invoices/types/voucher"
import type { PaymentVoucherPageRequest } from "@/shared/services/payment-voucher.service"
import { paymentVoucherService } from "@/shared/services/payment-voucher.service"

export const voucherKeys = {
  all: ["payment-vouchers"] as const,
  lists: () => [...voucherKeys.all, "list"] as const,
  list: (request: PaymentVoucherPageRequest) =>
    [...voucherKeys.lists(), request] as const,
  details: () => [...voucherKeys.all, "detail"] as const,
  detail: (id: number) => [...voucherKeys.details(), id] as const,
  byInvoice: (invoiceId: number) =>
    [...voucherKeys.all, "invoice", invoiceId] as const,
  nextNumber: () => [...voucherKeys.all, "next-number"] as const,
}

const LIST_PAGE_REQUEST: PaymentVoucherPageRequest = {
  pageNumber: 1,
  pageSize: 200,
  sortBy: "createdAt",
  sortOrder: "DESC",
}

export function useVouchersQuery(
  request: PaymentVoucherPageRequest = LIST_PAGE_REQUEST
) {
  return useQuery({
    queryKey: voucherKeys.list(request),
    queryFn: async () => (await paymentVoucherService.page(request)).data ?? [],
    staleTime: 30_000,
  })
}

export function useVoucherDetailQuery(id: number | null) {
  return useQuery({
    queryKey: voucherKeys.detail(id ?? 0),
    queryFn: () => paymentVoucherService.getById(id as number),
    enabled: id != null && id > 0,
  })
}

export function useInvoiceVouchersQuery(invoiceId: number | null) {
  return useQuery({
    queryKey: voucherKeys.byInvoice(invoiceId ?? 0),
    queryFn: () => paymentVoucherService.listByInvoice(invoiceId as number),
    enabled: invoiceId != null && invoiceId > 0,
  })
}

export function useNextVoucherNumberQuery(enabled: boolean) {
  return useQuery({
    queryKey: voucherKeys.nextNumber(),
    queryFn: () => paymentVoucherService.getNextNumber(),
    enabled,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCreateVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateVoucherRequest) =>
      paymentVoucherService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export function useDeleteVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => paymentVoucherService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}
