import { useEffect, useState } from "react"
import { Client } from "@stomp/stompjs"
import { useQueryClient } from "@tanstack/react-query"
import SockJS from "sockjs-client"

import { resolveWebSocketUrl } from "@/app/config/websocket"
import type { MarketplaceProductSyncRun } from "@/features/products/types/product"
import {
  marketplaceProductKeys,
  TERMINAL_SYNC_STATUSES,
} from "@/shared/queries/marketplace-product.query"

function createAuthenticatedSockJs(): WebSocket {
  return new SockJS(resolveWebSocketUrl(), undefined, {
    withCredentials: true,
  } as SockJS.Options)
}

interface UseMarketplaceProductSyncSubscriptionOptions {
  enabled?: boolean
}

export function useMarketplaceProductSyncSubscription(
  syncRunId: number | null,
  options: UseMarketplaceProductSyncSubscriptionOptions = {}
) {
  const { enabled = true } = options
  const queryClient = useQueryClient()
  const [usePollingFallback, setUsePollingFallback] = useState(false)

  useEffect(() => {
    if (!enabled || syncRunId == null || syncRunId <= 0 || usePollingFallback) {
      return
    }

    const topic = `/topic/marketplace-product-sync/${syncRunId}`
    const client = new Client({
      webSocketFactory: () => createAuthenticatedSockJs(),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(topic, (message) => {
          const payload = JSON.parse(message.body) as MarketplaceProductSyncRun
          queryClient.setQueryData(marketplaceProductKeys.sync(syncRunId), payload)

          if (TERMINAL_SYNC_STATUSES.includes(payload.status)) {
            void queryClient.invalidateQueries({ queryKey: marketplaceProductKeys.all })
            client.deactivate()
          }
        })
      },
      onStompError: () => {
        setUsePollingFallback(true)
      },
      onWebSocketClose: () => {
        setUsePollingFallback(true)
      },
      onWebSocketError: () => {
        setUsePollingFallback(true)
      },
    })

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [enabled, queryClient, syncRunId, usePollingFallback])

  return { usePollingFallback }
}
