import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  StoreCreateInput,
  StorePageRequest,
} from "@/features/stores/types/store"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"
import { storeService } from "@/shared/services/store.service"

export const storeKeys = {
  all: ["stores"] as const,
  lists: () => [...storeKeys.all, "list"] as const,
  list: (request: StorePageRequest) => [...storeKeys.lists(), request] as const,
  details: () => [...storeKeys.all, "detail"] as const,
  detail: (id: number) => [...storeKeys.details(), id] as const,
}

export function useStoresPageQuery(request: StorePageRequest) {
  return useQuery({
    queryKey: storeKeys.list(request),
    queryFn: () => storeService.pageStores(request),
  })
}

export function useStoreQuery(id: number) {
  return useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: () => storeService.getStore(id),
    enabled: id > 0,
  })
}

export function useCreateStoreMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StoreCreateInput) => storeService.createStore(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: storeKeys.lists() })
    },
  })
}

export function getStoreErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}
