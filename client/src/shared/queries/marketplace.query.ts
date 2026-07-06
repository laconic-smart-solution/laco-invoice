import { useQuery } from "@tanstack/react-query"

import { marketplaceService } from "@/shared/services/marketplace.service"

export const marketplaceKeys = {
  all: ["marketplaces"] as const,
  list: () => [...marketplaceKeys.all, "list"] as const,
}

export function useMarketplacesQuery() {
  return useQuery({
    queryKey: marketplaceKeys.list(),
    queryFn: () => marketplaceService.listMarketplaces(),
  })
}
