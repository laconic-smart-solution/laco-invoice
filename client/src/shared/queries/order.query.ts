import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  OrderExportRequest,
  OrderImportCommitRequest,
  OrderImportDecideRequest,
  OrderImportRequest,
  OrderPageRequest,
} from "@/shared/services/order.service"
import { orderService } from "@/shared/services/order.service"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"
import { customerKeys } from "@/shared/queries/customer.query"
import { orderImportFileKeys } from "@/shared/queries/order-import-file.query"

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (request: OrderPageRequest) => [...orderKeys.lists(), request] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  history: (orderId: number) => [...orderKeys.all, "history", orderId] as const,
  stats: (storeId?: number) => [...orderKeys.all, "stats", storeId ?? "all"] as const,
  exportPreview: (request: Omit<OrderExportRequest, "pageNumber" | "pageSize" | "columns">) =>
    [...orderKeys.all, "export-preview", request] as const,
  importPreviewExcelRows: (
    storeId: number,
    batchId: number,
    previewOrderId: number
  ) =>
    [
      ...orderKeys.all,
      "import-preview-excel-rows",
      storeId,
      batchId,
      previewOrderId,
    ] as const,
}

export function useOrdersPageQuery(request: OrderPageRequest, enabled = true) {
  return useQuery({
    queryKey: orderKeys.list(request),
    queryFn: () => orderService.pageOrders(request),
    enabled,
  })
}

export function useOrderStatsQuery(storeId?: number) {
  return useQuery({
    queryKey: orderKeys.stats(storeId),
    queryFn: () => orderService.getStats(storeId),
  })
}

export function useOrderDetailQuery(id: number | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? 0),
    queryFn: () => orderService.getOrder(id as number),
    enabled: id != null && id > 0,
  })
}

export function useOrderHistoryQuery(orderId: number | null, enabled = true) {
  return useInfiniteQuery({
    queryKey: orderKeys.history(orderId ?? 0),
    queryFn: ({ pageParam }) =>
      orderService.pageOrderHistory(orderId as number, pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta?.page ?? 1
      const totalPages = lastPage.meta?.totalPages ?? 0
      if (page >= totalPages) {
        return undefined
      }
      return page + 1
    },
    enabled: enabled && orderId != null && orderId > 0,
  })
}

export function useTriggerOrderSyncMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => orderService.triggerSync(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      // Customers are upserted inline during order sync
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useImportOrdersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: OrderImportRequest) => orderService.importExcel(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderImportFileKeys.all })
    },
  })
}

export function usePreviewOrderImportMutation() {
  return useMutation({
    mutationFn: (request: OrderImportRequest) => orderService.previewImport(request),
  })
}

export function useDecideOrderImportMutation() {
  return useMutation({
    mutationFn: (request: OrderImportDecideRequest) =>
      orderService.decideImportPreview(request),
  })
}

export function useImportPreviewExcelRowsQuery(
  storeId: number | null,
  batchId: number | null,
  previewOrderId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: orderKeys.importPreviewExcelRows(
      storeId ?? 0,
      batchId ?? 0,
      previewOrderId ?? 0
    ),
    queryFn: () =>
      orderService.getImportPreviewExcelRows({
        storeId: storeId as number,
        batchId: batchId as number,
        previewOrderId: previewOrderId as number,
      }),
    enabled:
      enabled &&
      storeId != null &&
      storeId > 0 &&
      batchId != null &&
      batchId > 0 &&
      previewOrderId != null &&
      previewOrderId > 0,
  })
}

export function useCommitOrderImportMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: OrderImportCommitRequest) =>
      orderService.commitImportPreview(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderImportFileKeys.all })
    },
  })
}

export function useOrderExportPreviewQuery(
  request: Omit<OrderExportRequest, "pageNumber" | "pageSize" | "columns">,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: orderKeys.exportPreview(request),
    queryFn: ({ pageParam }) =>
      orderService.previewExport({
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

export function useExportOrdersMutation() {
  return useMutation({
    mutationFn: (request: OrderExportRequest) => orderService.exportExcel(request),
  })
}

export function getOrderErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}
