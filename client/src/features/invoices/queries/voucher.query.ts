import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { voucherLocalService } from "../services/voucher-local.service"
import type { CreateVoucherRequest } from "../types/voucher"
import { INVOICES_QUERY_KEY } from "./invoice.query"

export const VOUCHERS_QUERY_KEY = ["payment_vouchers"]

export function useVouchersQuery() {
  return useQuery({
    queryKey: VOUCHERS_QUERY_KEY,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120))
      return voucherLocalService.getAll()
    },
  })
}

export function useVoucherDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...VOUCHERS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null
      await new Promise((r) => setTimeout(r, 100))
      return voucherLocalService.getById(id) ?? null
    },
    enabled: Boolean(id),
  })
}

export function useInvoiceVouchersQuery(invoiceId: string | undefined) {
  return useQuery({
    queryKey: [...VOUCHERS_QUERY_KEY, "invoice", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return []
      await new Promise((r) => setTimeout(r, 100))
      return voucherLocalService.getByInvoiceId(invoiceId)
    },
    enabled: Boolean(invoiceId),
  })
}

export function useCreateVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (req: CreateVoucherRequest) => {
      await new Promise((r) => setTimeout(r, 300))
      return voucherLocalService.create(req)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export function useDeleteVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200))
      return voucherLocalService.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}
