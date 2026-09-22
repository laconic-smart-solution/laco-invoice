import { useEffect, useRef } from "react"
import { PanelLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { FlowQueueFilter } from "@/features/flow/data/flow-constants"
import {
  canGenerateFlowVoucher,
  needsFlowReview,
} from "@/features/flow/util/flow-eligibility"
import { cn } from "@/lib/utils"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"

interface FlowQueueRailProps {
  runs: ApiOrderInputRunDto[]
  selectedId: number | null
  filter: FlowQueueFilter
  onSelect: (orderSet: ApiOrderInputRunDto) => void
  onExpand: () => void
}

function railTone(orderSet: ApiOrderInputRunDto) {
  if (needsFlowReview(orderSet)) return "error"
  if (orderSet.status === "DRAFT") return "neutral"
  if (canGenerateFlowVoucher(orderSet)) return "warning"
  return "success"
}

export function FlowQueueRail({
  runs,
  selectedId,
  filter,
  onSelect,
  onExpand,
}: FlowQueueRailProps) {
  const { t } = useTranslation("flow")
  const selectedRef = useRef<HTMLButtonElement | null>(null)
  const filtered = runs.filter((orderSet) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "ready" && canGenerateFlowVoucher(orderSet)) ||
      (filter === "attention" && needsFlowReview(orderSet))
    return matchesFilter
  })
  const alertCount = runs.filter(needsFlowReview).length

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" })
  }, [selectedId])

  return (
    <aside className="flow-queue-rail" aria-label={t("queue.title")}>
      <button
        type="button"
        className="flow-queue-rail__expand"
        aria-label={t("show_queue")}
        title={t("show_queue")}
        onClick={onExpand}
      >
        <PanelLeft className="size-4" aria-hidden />
        {alertCount > 0 ? (
          <span className="flow-queue-rail__badge">{alertCount}</span>
        ) : null}
      </button>
      <div
        className="flow-queue-rail__ids"
        role="listbox"
        aria-label={t("queue.title")}
      >
        {filtered.map((orderSet) => {
          const isSelected = selectedId === orderSet.id
          const tone = railTone(orderSet)
          return (
            <button
              key={orderSet.id}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={t("queue.select_set", { id: orderSet.id })}
              className={cn(
                "flow-queue-rail__id",
                `flow-queue-rail__id--${tone}`,
                isSelected && "flow-queue-rail__id--selected"
              )}
              onClick={() => onSelect(orderSet)}
            >
              {orderSet.id}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
