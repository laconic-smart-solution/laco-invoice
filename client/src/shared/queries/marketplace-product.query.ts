import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { MarketplaceProductSyncStatus } from "@/features/products/types/product"
import type {
  MarketplaceProductPageRequest,
  MarketplaceProductStatsParams,
  MarketplaceProductSyncParams,
} from "@/shared/services/marketplace-product.service"
import { marketplaceProductService } from "@/shared/services/marketplace-product.service"

const SYNC_POLL_INTERVAL_MS = 2000

export const TERMINAL_SYNC_STATUSES: MarketplaceProductSyncStatus[] = ["COMPLETED", "FAILED"]

export const marketplaceProductKeys = {
  all: ["marketplace-products"] as const,
  sources: () => [...marketplaceProductKeys.all, "sources"] as const,
  lists: () => [...marketplaceProductKeys.all, "list"] as const,
  list: (request: MarketplaceProductPageRequest) =>
    [...marketplaceProductKeys.lists(), request] as const,
  stats: (params: MarketplaceProductStatsParams) =>
    [...marketplaceProductKeys.all, "stats", params] as const,
  detail: (productId: number) => [...marketplaceProductKeys.all, "detail", productId] as const,
  sync: (syncRunId: number) => [...marketplaceProductKeys.all, "sync", syncRunId] as const,
}

export function useMarketplaceProductSourcesQuery() {
  return useQuery({
    queryKey: marketplaceProductKeys.sources(),
    queryFn: () => marketplaceProductService.listSources(),
  })
}

export function useMarketplaceProductsPageQuery(
  request: MarketplaceProductPageRequest,
  enabled = true
) {
  return useQuery({
    queryKey: marketplaceProductKeys.list(request),
    queryFn: () => marketplaceProductService.pageProducts(request),
    enabled,
  })
}

export function useMarketplaceProductStatsQuery(
  params: MarketplaceProductStatsParams,
  enabled = true
) {
  return useQuery({
    queryKey: marketplaceProductKeys.stats(params),
    queryFn: () => marketplaceProductService.getStats(params),
    enabled,
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
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: marketplaceProductKeys.sources() })
      if (run?.id) {
        queryClient.setQueryData(marketplaceProductKeys.sync(run.id), run)
      }
    },
  })
}

interface MarketplaceProductSyncStatusQueryOptions {
  pollingEnabled?: boolean
}

export function useMarketplaceProductSyncStatusQuery(
  syncRunId: number | null,
  enabled = true,
  options: MarketplaceProductSyncStatusQueryOptions = {}
) {
  const { pollingEnabled = true } = options

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
      if (!pollingEnabled) {
        return false
      }
      const status = query.state.data?.status
      if (status && TERMINAL_SYNC_STATUSES.includes(status)) {
        return false
      }
      return SYNC_POLL_INTERVAL_MS
    },
  })
}
