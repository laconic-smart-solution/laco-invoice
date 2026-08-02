import { useEffect, useRef, useState } from "react"
import { Client } from "@stomp/stompjs"
import { useQueryClient } from "@tanstack/react-query"
import SockJS from "sockjs-client"

import { resolveWebSocketUrl } from "@/app/config/websocket"
import type { OrderBulkGenerateRun } from "@/shared/services/order.service"
import {
  orderKeys,
  TERMINAL_BULK_GENERATE_STATUSES,
} from "@/shared/queries/order.query"
import { useOrderBulkGenerateStore } from "@/shared/stores/order-bulk-generate-store"

const LOG_PREFIX = "[order-bulk-generate:ws]"

function createAuthenticatedSockJs(): WebSocket {
  return new SockJS(resolveWebSocketUrl(), undefined, {
    withCredentials: true,
  } as SockJS.Options)
}

interface UseOrderBulkGenerateSubscriptionOptions {
  enabled?: boolean
}

export function useOrderBulkGenerateSubscription(
  runId: number | null,
  options: UseOrderBulkGenerateSubscriptionOptions = {}
) {
  const { enabled = true } = options
  const queryClient = useQueryClient()
  const [usePollingFallback, setUsePollingFallback] = useState(false)
  const intentionalCloseRef = useRef(false)

  useEffect(() => {
    setUsePollingFallback(false)
  }, [runId])

  useEffect(() => {
    if (!enabled || runId == null || runId <= 0 || usePollingFallback) {
      return
    }

    intentionalCloseRef.current = false
    const topic = `/topic/order-bulk-generate/${runId}`
    const wsUrl = resolveWebSocketUrl()
    console.log(`${LOG_PREFIX} connecting`, { runId, topic, wsUrl })

    const client = new Client({
      webSocketFactory: () => createAuthenticatedSockJs(),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`${LOG_PREFIX} connected OK`, { runId, topic })
        client.subscribe(topic, (message) => {
          const payload = JSON.parse(message.body) as OrderBulkGenerateRun
          console.log(`${LOG_PREFIX} progress`, {
            runId,
            status: payload.status,
            processed: payload.processedCount,
            total: payload.totalCount,
          })
          queryClient.setQueryData(orderKeys.bulkGenerate(runId), payload)
          useOrderBulkGenerateStore.getState().applyProgress(payload)

          if (TERMINAL_BULK_GENERATE_STATUSES.includes(payload.status)) {
            void queryClient.invalidateQueries({ queryKey: orderKeys.all })
            void queryClient.invalidateQueries({ queryKey: ["invoices"] })
            intentionalCloseRef.current = true
            client.deactivate()
          }
        })
      },
      onStompError: (frame) => {
        console.warn(`${LOG_PREFIX} STOMP error — falling back to polling`, {
          runId,
          message: frame.headers["message"],
          body: frame.body,
        })
        if (!intentionalCloseRef.current) {
          setUsePollingFallback(true)
        }
      },
      onWebSocketError: (event) => {
        console.warn(`${LOG_PREFIX} WebSocket error — falling back to polling`, {
          runId,
          event,
        })
        if (!intentionalCloseRef.current) {
          setUsePollingFallback(true)
        }
      },
      onWebSocketClose: (event) => {
        if (intentionalCloseRef.current) {
          console.log(`${LOG_PREFIX} closed (intentional)`, { runId })
          return
        }
        console.warn(
          `${LOG_PREFIX} WebSocket closed unexpectedly — falling back to polling`,
          {
            runId,
            code: event.code,
            reason: event.reason,
          }
        )
        setUsePollingFallback(true)
      },
    })

    client.activate()

    return () => {
      intentionalCloseRef.current = true
      client.deactivate()
    }
  }, [enabled, queryClient, runId, usePollingFallback])

  useEffect(() => {
    if (usePollingFallback && runId != null) {
      console.warn(`${LOG_PREFIX} using HTTP polling fallback`, { runId })
    }
  }, [runId, usePollingFallback])

  return { usePollingFallback }
}
