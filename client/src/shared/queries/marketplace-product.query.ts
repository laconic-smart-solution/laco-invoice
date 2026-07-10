import { useQuery } from "@tanstack/react-query"

import type { MarketplaceProductListParams } from "@/shared/services/marketplace-product.service"
import { marketplaceProductService } from "@/shared/services/marketplace-product.service"

export const marketplaceProductKeys = {
  all: ["marketplace-products"] as const,
  sources: () => [...marketplaceProductKeys.all, "sources"] as const,
  list: (params: MarketplaceProductListParams) =>
    [...marketplaceProductKeys.all, "list", params] as const,
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
