import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  orderImportFileService,
  type OrderImportFilePageRequest,
} from "@/shared/services/order-import-file.service"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"

export const orderImportFileKeys = {
  all: ["order-import-files"] as const,
  lists: () => [...orderImportFileKeys.all, "list"] as const,
  list: (request: OrderImportFilePageRequest) =>
    [...orderImportFileKeys.lists(), request] as const,
  details: () => [...orderImportFileKeys.all, "detail"] as const,
  detail: (id: number) => [...orderImportFileKeys.details(), id] as const,
}

export function useOrderImportFilesPageQuery(request: OrderImportFilePageRequest) {
  return useQuery({
    queryKey: orderImportFileKeys.list(request),
    queryFn: () => orderImportFileService.page(request),
  })
}

export function useOrderImportFileDetailQuery(id: number | null) {
  return useQuery({
    queryKey: orderImportFileKeys.detail(id ?? 0),
    queryFn: () => orderImportFileService.getById(id as number),
    enabled: id != null && id > 0,
  })
}

export function getOrderImportFileErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (isAxiosStatusMessage(error)) {
    return extractApiErrorMessage(error) || fallback
  }
  return extractApiErrorMessage(error) || fallback
}

/** Invalidate import-file lists after a successful order import commit. */
export function useInvalidateOrderImportFiles() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: orderImportFileKeys.all })
  }
}
