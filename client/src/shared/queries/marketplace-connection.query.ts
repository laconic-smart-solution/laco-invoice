import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { MarketplaceCode } from "@/features/stores/config/marketplaces"
import type { MarketplaceConnectInput } from "@/features/stores/types/store"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"
import { getMarketplaceConnectionService } from "@/shared/services/marketplace-connection.service"
import { storeKeys } from "@/shared/queries/store.query"

export const marketplaceConnectionKeys = {
  all: ["marketplace-connections"] as const,
  list: (marketplace: MarketplaceCode, storeId: number) =>
    [...marketplaceConnectionKeys.all, marketplace, storeId] as const,
}

export function useMarketplaceConnectionsQuery(
  marketplace: MarketplaceCode,
  storeId: number,
  enabled = true
) {
  return useQuery({
    queryKey: marketplaceConnectionKeys.list(marketplace, storeId),
    queryFn: () => getMarketplaceConnectionService(marketplace).listConnections(storeId),
    enabled: enabled && storeId > 0,
  })
}

export function useMarketplaceAuthorizeUrlMutation(marketplace: MarketplaceCode) {
  return useMutation({
    mutationFn: (storeId: number) =>
      getMarketplaceConnectionService(marketplace).getAuthorizeUrl(storeId),
  })
}

export function useMarketplaceConnectMutation(marketplace: MarketplaceCode) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      storeId,
      payload,
    }: {
      storeId: number
      payload: MarketplaceConnectInput
    }) => getMarketplaceConnectionService(marketplace).connect(storeId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: marketplaceConnectionKeys.list(marketplace, variables.storeId),
      })
      void queryClient.invalidateQueries({
        queryKey: storeKeys.detail(variables.storeId),
      })
    },
  })
}

export function useMarketplaceRefreshMutation(marketplace: MarketplaceCode) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      storeId,
      externalConnectionId,
    }: {
      storeId: number
      externalConnectionId: string
    }) =>
      getMarketplaceConnectionService(marketplace).refreshConnection(
        storeId,
        externalConnectionId
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: marketplaceConnectionKeys.list(marketplace, variables.storeId),
      })
    },
  })
}

export function useMarketplaceRevokeMutation(marketplace: MarketplaceCode) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      storeId,
      externalConnectionId,
    }: {
      storeId: number
      externalConnectionId: string
    }) =>
      getMarketplaceConnectionService(marketplace).revokeConnection(
        storeId,
        externalConnectionId
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: marketplaceConnectionKeys.list(marketplace, variables.storeId),
      })
    },
  })
}

export function getMarketplaceErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}
