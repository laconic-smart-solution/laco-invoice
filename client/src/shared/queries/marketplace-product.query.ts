import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  MarketplaceProduct,
  MarketplaceProductSource,
  MarketplaceProductSyncStatus,
} from "@/features/products/types/product"
import type {
  MarketplaceProductListParams,
  MarketplaceProductSyncParams,
} from "@/shared/services/marketplace-product.service"
import {
  buildProductSourceKey,
  marketplaceProductService,
} from "@/shared/services/marketplace-product.service"

const SYNC_POLL_INTERVAL_MS = 2000
const ALL_SOURCES_PAGE_LIMIT = 100

export const TERMINAL_SYNC_STATUSES: MarketplaceProductSyncStatus[] = ["COMPLETED", "FAILED"]

export interface MarketplaceProductsAcrossSourcesParams {
  priceMin?: number
  priceMax?: number
}

export const marketplaceProductKeys = {
  all: ["marketplace-products"] as const,
  sources: () => [...marketplaceProductKeys.all, "sources"] as const,
  list: (params: MarketplaceProductListParams) =>
    [...marketplaceProductKeys.all, "list", params] as const,
  listAll: (sourceKeys: string[], params: MarketplaceProductsAcrossSourcesParams) =>
    [...marketplaceProductKeys.all, "list-all", sourceKeys, params] as const,
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

async function listAllProductsForSource(
  source: MarketplaceProductSource,
  params: MarketplaceProductsAcrossSourcesParams
) {
  const items: MarketplaceProduct[] = []
  let page = 1
  let total = 0

  do {
    const result = await marketplaceProductService.listProducts({
      storeId: source.storeId,
      marketplaceCode: source.marketplaceCode,
      page,
      limit: ALL_SOURCES_PAGE_LIMIT,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
    })
    items.push(...result.items)
    total = result.total
    if (result.items.length === 0) {
      break
    }
    page += 1
  } while (items.length < total)

  return items
}

export function useMarketplaceProductsAcrossSourcesQuery(
  sources: MarketplaceProductSource[],
  params: MarketplaceProductsAcrossSourcesParams,
  enabled = true
) {
  const sourceKeys = sources.map((source) =>
    buildProductSourceKey(source.storeId, source.marketplaceCode)
  )

  return useQuery({
    queryKey: marketplaceProductKeys.listAll(sourceKeys, params),
    queryFn: async () => {
      const results = await Promise.all(
        sources.map((source) => listAllProductsForSource(source, params))
      )
      const items = results.flat()
      return { items, total: items.length }
    },
    enabled: enabled && sources.length > 0,
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
