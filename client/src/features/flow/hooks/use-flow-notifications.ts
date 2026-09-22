import { useMemo, useState } from "react"

import {
  isFlowVoucherExportable,
  needsFlowReview,
} from "@/features/flow/util/flow-eligibility"
import type { Voucher } from "@/features/vouchers/types/voucher"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"

export type FlowNotification =
  | {
      id: string
      kind: "mismatch"
      run: ApiOrderInputRunDto
    }
  | {
      id: string
      kind: "export"
      voucher: Voucher
    }

const MAX_VISIBLE = 8

export function useFlowNotifications(
  runs: ApiOrderInputRunDto[],
  vouchers: Voucher[]
) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())

  const items = useMemo<FlowNotification[]>(() => {
    const mismatches = runs.filter(needsFlowReview).map((run) => ({
      id: `mismatch-${run.id}`,
      kind: "mismatch" as const,
      run,
    }))
    const exports = vouchers.filter(isFlowVoucherExportable).map((voucher) => ({
      id: `export-${voucher.id}`,
      kind: "export" as const,
      voucher,
    }))
    return [...mismatches, ...exports]
  }, [runs, vouchers])

  const visibleItems = items.slice(0, MAX_VISIBLE)
  const hiddenCount = Math.max(0, items.length - visibleItems.length)
  const unreadCount = items.filter((item) => !readIds.has(item.id)).length

  const isUnread = (id: string) => !readIds.has(id)

  const markRead = (id: string) => {
    setReadIds((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  const markAllRead = () => {
    setReadIds(new Set(items.map((item) => item.id)))
  }

  return {
    items: visibleItems,
    hiddenCount,
    totalCount: items.length,
    unreadCount,
    isUnread,
    markRead,
    markAllRead,
  }
}
