import {
  getMarketplaceErrorMessage,
  useMarketplaceAuthorizeUrlMutation,
  useMarketplaceConnectMutation,
  useMarketplaceConnectionsQuery,
  useMarketplaceRefreshMutation,
  useMarketplaceRevokeMutation,
} from "@/shared/queries/marketplace-connection.query"

export const lazadaConnectionKeys = {
  all: ["lazada-connections"] as const,
  list: (storeId: number) => ["lazada-connections", storeId] as const,
}

export function useLazadaConnectionsQuery(storeId: number) {
  return useMarketplaceConnectionsQuery("LAZADA", storeId)
}

export function useLazadaAuthorizeUrlMutation() {
  return useMarketplaceAuthorizeUrlMutation("LAZADA")
}

export function useLazadaConnectMutation() {
  return useMarketplaceConnectMutation("LAZADA")
}

export function useLazadaRefreshMutation() {
  return useMarketplaceRefreshMutation("LAZADA")
}

export function useLazadaRevokeMutation() {
  return useMarketplaceRevokeMutation("LAZADA")
}

export function getLazadaErrorMessage(error: unknown, fallback: string): string {
  return getMarketplaceErrorMessage(error, fallback)
}
