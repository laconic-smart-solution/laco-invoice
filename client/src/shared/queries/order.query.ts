import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { OrderPageRequest } from "@/shared/services/order.service"
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
}

export function useOrdersPageQuery(request: OrderPageRequest) {
  return useQuery({
    queryKey: orderKeys.list(request),
    queryFn: () => orderService.pageOrders(request),
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
      // Customers are upserted inline during order sync
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
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
