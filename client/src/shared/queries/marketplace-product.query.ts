import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { MarketplaceProductSyncStatus } from "@/features/products/types/product"
import type {
  MarketplaceProductListParams,
  MarketplaceProductSyncParams,
} from "@/shared/services/marketplace-product.service"
import { marketplaceProductService } from "@/shared/services/marketplace-product.service"

const SYNC_POLL_INTERVAL_MS = 2000

const TERMINAL_SYNC_STATUSES: MarketplaceProductSyncStatus[] = ["COMPLETED", "FAILED"]

export const marketplaceProductKeys = {
  all: ["marketplace-products"] as const,
  sources: () => [...marketplaceProductKeys.all, "sources"] as const,
  list: (params: MarketplaceProductListParams) =>
    [...marketplaceProductKeys.all, "list", params] as const,
  detail: (productId: number) => [...marketplaceProductKeys.all, "detail", productId] as const,
  sync: (syncRunId: number) => [...marketplaceProductKeys.all, "sync", syncRunId] as const,
}

export function useMarketplaceProductSourcesQuery() {
  return useQuery({
    queryKey: marketplaceProductKeys.sources(),
    queryFn: () => marketplaceProductService.listSources(),
  })
}

export function useMarketplaceProductsQuery(
  params: MarketplaceProductListParams | null,
  enabled = true
) {
  return useQuery({
    queryKey: marketplaceProductKeys.list(params ?? { storeId: 0, marketplaceCode: "LAZADA" }),
    queryFn: () => {
      if (!params) {
        return Promise.resolve({ items: [], total: 0 })
      }
      return marketplaceProductService.listProducts(params)
    },
    enabled: enabled && params != null && params.storeId > 0,
  })
}

export function useMarketplaceProductDetailQuery(productId: number) {
  return useQuery({
    queryKey: marketplaceProductKeys.detail(productId),
    queryFn: () => marketplaceProductService.getDetail(productId),
    enabled: productId > 0,
  })
}

export function useStartMarketplaceProductSyncMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: MarketplaceProductSyncParams) =>
      marketplaceProductService.startSync(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: marketplaceProductKeys.sources() })
    },
  })
}

export function useMarketplaceProductSyncStatusQuery(
  syncRunId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: marketplaceProductKeys.sync(syncRunId ?? 0),
    queryFn: () => {
      if (syncRunId == null) {
        return Promise.reject(new Error("Sync run id is required"))
      }
      return marketplaceProductService.getSyncStatus(syncRunId)
    },
    enabled: enabled && syncRunId != null && syncRunId > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && TERMINAL_SYNC_STATUSES.includes(status)) {
        return false
      }
      return SYNC_POLL_INTERVAL_MS
    },
  })
}
