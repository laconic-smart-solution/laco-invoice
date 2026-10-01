import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  GenerateVoucherRequest,
  VoucherExportRequest,
  VoucherPageRequest,
  VoucherPreviewRequest,
  VoucherPreviewFromInvoiceRequest,
} from "@/features/vouchers/types/voucher"
import { invoiceKeys } from "@/features/invoices/queries/invoice.query"
import { orderInputRunKeys } from "@/shared/queries/order-input-run.query"
import { voucherService } from "@/shared/services/voucher.service"

export const voucherKeys = {
  all: ["vouchers"] as const,
  lists: () => [...voucherKeys.all, "list"] as const,
  list: (request: VoucherPageRequest) =>
    [...voucherKeys.lists(), request] as const,
  byOrderInputRun: (runId: number) =>
    [...voucherKeys.all, "by-order-input-run", runId] as const,
  byInvoice: (invoiceId: number) =>
    [...voucherKeys.all, "by-invoice", invoiceId] as const,
  details: () => [...voucherKeys.all, "detail"] as const,
  detail: (id: number) => [...voucherKeys.details(), id] as const,
}

const LIST_PAGE_REQUEST: VoucherPageRequest = {
  pageNumber: 1,
  pageSize: 200,
  sortBy: "createdAt",
  sortOrder: "DESC",
}

export function useVouchersQuery(request: VoucherPageRequest = LIST_PAGE_REQUEST) {
  return useQuery({
    queryKey: voucherKeys.list(request),
    queryFn: async () => (await voucherService.page(request)).data ?? [],
    staleTime: 30_000,
  })
}

export function useVoucherDetailQuery(id: number | null) {
  return useQuery({
    queryKey: voucherKeys.detail(id ?? 0),
    queryFn: () => voucherService.getById(id as number),
    enabled: id != null && id > 0,
  })
}

export function useVouchersByOrderInputRunQuery(runId: number | null) {
  return useQuery({
    queryKey: voucherKeys.byOrderInputRun(runId ?? 0),
    queryFn: () => voucherService.getByOrderInputRun(runId as number),
    enabled: runId != null && runId > 0,
    staleTime: 30_000,
  })
}

export function useVouchersByInvoiceQuery(invoiceId: number | null) {
  return useQuery({
    queryKey: voucherKeys.byInvoice(invoiceId ?? 0),
    queryFn: () => voucherService.getByInvoice(invoiceId as number),
    enabled: invoiceId != null && invoiceId > 0,
    staleTime: 30_000,
  })
}

export function useVoucherPreviewMutation() {
  return useMutation({
    mutationFn: (request: VoucherPreviewRequest) =>
      voucherService.previewFromOrderInput(request),
  })
}

export function useVoucherPreviewFromInvoiceMutation() {
  return useMutation({
    mutationFn: (request: VoucherPreviewFromInvoiceRequest) =>
      voucherService.previewFromInvoice(request),
  })
}

export function useGenerateVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: GenerateVoucherRequest) =>
      voucherService.generate(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.all })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export function useUpdateVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number
      request: GenerateVoucherRequest
    }) => voucherService.update(id, request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
      void queryClient.invalidateQueries({
        queryKey: voucherKeys.detail(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.all })
    },
  })
}

export function usePostVoucherToErpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => voucherService.postToErp(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
      void queryClient.invalidateQueries({ queryKey: voucherKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.all })
    },
  })
}

export function useExportVouchersExcelMutation() {
  return useMutation({
    mutationFn: (request: VoucherExportRequest) =>
      voucherService.exportExcel(request),
  })
}

export function useExportVouchersCsvMutation() {
  return useMutation({
    mutationFn: (request: VoucherExportRequest) =>
      voucherService.exportCsv(request),
  })
}

export function useExportSingleVoucherExcelMutation() {
  return useMutation({
    mutationFn: ({ id, voucherNumber }: { id: number; voucherNumber?: string }) =>
      voucherService.exportSingleExcel(id, voucherNumber),
  })
}

export function useExportSingleVoucherCsvMutation() {
  return useMutation({
    mutationFn: ({ id, voucherNumber }: { id: number; voucherNumber?: string }) =>
      voucherService.exportSingleCsv(id, voucherNumber),
  })
}

export function useExportVouchersPdfMutation() {
  return useMutation({
    mutationFn: (request: VoucherExportRequest) =>
      voucherService.exportPdf(request),
  })
}

export function useExportSingleVoucherPdfMutation() {
  return useMutation({
    mutationFn: ({ id, voucherNumber }: { id: number; voucherNumber?: string }) =>
      voucherService.exportSinglePdf(id, voucherNumber),
  })
}


