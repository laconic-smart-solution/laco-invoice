import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  OrderExportRequest,
  OrderImportRequest,
  OrderPageRequest,
} from "@/shared/services/order.service"
import { orderService } from "@/shared/services/order.service"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"
import { customerKeys } from "@/shared/queries/customer.query"

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (request: OrderPageRequest) => [...orderKeys.lists(), request] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  stats: (storeId?: number) => [...orderKeys.all, "stats", storeId ?? "all"] as const,
  exportPreview: (request: Omit<OrderExportRequest, "pageNumber" | "pageSize" | "columns">) =>
    [...orderKeys.all, "export-preview", request] as const,
}

export function useOrdersPageQuery(request: OrderPageRequest) {
  return useQuery({
    queryKey: orderKeys.list(request),
    queryFn: () => orderService.pageOrders(request),
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

export function useBulkGenerateOrdersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: OrderExportRequest) => orderService.bulkGenerateZip(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["invoices"] })
    },
  })
}

export function getOrderErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}
