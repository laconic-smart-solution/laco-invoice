import { PanelLeftClose, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SlidingText } from "@/components/common/sliding-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FlowQueueFilter } from "@/features/flow/data/flow-constants"
import {
  canGenerateFlowVoucher,
  needsFlowReview,
} from "@/features/flow/util/flow-eligibility"
import { cn } from "@/lib/utils"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"
import { formatCurrency } from "@/util/format"
import { useLocaleStore } from "@/shared/stores/locale-store"

interface FlowWorkQueueProps {
  runs: ApiOrderInputRunDto[]
  selectedId: number | null
  search: string
  filter: FlowQueueFilter
  isLoading: boolean
  isFetching?: boolean
  error: unknown
  onRetry: () => void
  onSearchChange: (value: string) => void
  onFilterChange: (filter: FlowQueueFilter) => void
  onSelect: (orderSet: ApiOrderInputRunDto) => void
  onHide?: () => void
}

function displayStatus(
  orderSet: ApiOrderInputRunDto,
  t: (key: string) => string
) {
  if (needsFlowReview(orderSet)) {
    return { label: t("queue.needs_review"), tone: "error" }
  }
  if (orderSet.status === "DRAFT") {
    return { label: t("queue.draft"), tone: "neutral" }
  }
  if (canGenerateFlowVoucher(orderSet)) {
    return { label: t("queue.status_ready"), tone: "warning" }
  }
  return { label: t("queue.voucher_ready"), tone: "success" }
}

export function FlowWorkQueue({
  runs,
  selectedId,
  search,
  filter,
  isLoading,
  isFetching = false,
  error,
  onRetry,
  onSearchChange,
  onFilterChange,
  onSelect,
  onHide,
}: FlowWorkQueueProps) {
  const { t } = useTranslation("flow")
  const locale = useLocaleStore((state) => state.locale)
  const filtered = runs.filter((orderSet) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "ready" && canGenerateFlowVoucher(orderSet)) ||
      (filter === "attention" && needsFlowReview(orderSet))
    return matchesFilter
  })
  const alertCount = runs.filter(needsFlowReview).length

  return (
    <aside className="flow-queue" aria-label={t("queue.title")}>
      <div className="flow-queue__header">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("queue.title")}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {isFetching && !isLoading
              ? t("queue.fetching")
              : t("queue.count", {
                  filtered: filtered.length,
                  total: runs.length,
                })}
          </p>
        </div>
        <div className="flow-queue__header-actions">
          <span className="flow-count-badge">
            {t("queue.alerts", { count: alertCount })}
          </span>
          {onHide ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              aria-label={t("hide_queue")}
              title={t("hide_queue")}
              onClick={onHide}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flow-queue__search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("search_placeholder")}
            aria-label={t("search_aria")}
            data-shortcut-search="orders"
            className="h-9 w-full rounded-lg bg-background pl-9"
          />
        </div>
      </div>

      <div className="flow-queue__filters" aria-label={t("queue.title")}>
        {(
          [
            ["all", t("queue.all")],
            ["ready", t("queue.ready")],
            ["attention", t("queue.attention")],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={cn(
              "flow-filter-chip",
              filter === value && "flow-filter-chip--active"
            )}
            aria-pressed={filter === value}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flow-queue__list" role="listbox" aria-label={t("queue.title")}>
        {isLoading ? (
          <p className="px-3 py-6 text-xs text-muted-foreground">
            {t("queue.loading")}
          </p>
        ) : error ? (
          <div className="space-y-2 px-3 py-6">
            <p className="text-xs text-destructive">{t("queue.error")}</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              {t("queue.retry")}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-xs text-muted-foreground">
            {t("queue.empty")}
          </p>
        ) : (
          filtered.map((orderSet) => {
            const status = displayStatus(orderSet, t)
            const isSelected = selectedId === orderSet.id
            return (
              <button
                key={orderSet.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "group flow-queue-card",
                  isSelected && "flow-queue-card--selected"
                )}
                onClick={() => onSelect(orderSet)}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 flex-1">
                    <SlidingText className="text-xs font-semibold text-foreground">
                      {`#${orderSet.id} · ${orderSet.title}`}
                    </SlidingText>
                    {orderSet.storeName ? (
                      <SlidingText className="mt-1 text-[11px] text-muted-foreground">
                        {orderSet.storeName}
                      </SlidingText>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "flow-status-dot",
                      `flow-status-dot--${status.tone}`
                    )}
                    aria-hidden
                  />
                </span>
                <span className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {status.label}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    {formatCurrency(
                      orderSet.excelMatchedAmount ??
                        orderSet.invoiceTotalAmount ??
                        0,
                      locale,
                      "THB"
                    )}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
