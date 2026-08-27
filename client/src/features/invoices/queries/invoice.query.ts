import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { invoiceLocalService } from "../services/invoice-local.service"
import type { CreateInvoiceRequest, InvoiceStatus } from "../types/invoice"

export const INVOICES_QUERY_KEY = ["invoices"]

export function useInvoicesQuery() {
  return useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: async () => {
      // Simulate light async delay for realistic UI feedback
      await new Promise((r) => setTimeout(r, 150))
      return invoiceLocalService.getAll()
    },
  })
}

export function useInvoiceDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null
      await new Promise((r) => setTimeout(r, 100))
      return invoiceLocalService.getById(id) ?? null
    },
    enabled: Boolean(id),
  })
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (req: CreateInvoiceRequest) => {
      await new Promise((r) => setTimeout(r, 300))
      return invoiceLocalService.create(req)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export function useUpdateInvoiceNumberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, invoiceNumber }: { id: string; invoiceNumber: string }) => {
      await new Promise((r) => setTimeout(r, 150))
      return invoiceLocalService.updateInvoiceNumber(id, invoiceNumber)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...INVOICES_QUERY_KEY, variables.id] })
    },
  })
}

export function useUpdateInvoiceStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      await new Promise((r) => setTimeout(r, 200))
      return invoiceLocalService.updateStatus(id, status)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...INVOICES_QUERY_KEY, variables.id] })
    },
  })
}