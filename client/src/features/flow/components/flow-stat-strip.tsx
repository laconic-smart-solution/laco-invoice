import {
  AlertTriangle,
  ClipboardList,
  FileInput,
  FileOutput,
  HandCoins,
  Receipt,
  Sparkles,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { FlowStatId } from "@/features/flow/data/flow-constants"
import type { FlowStageCounts } from "@/features/flow/util/flow-eligibility"
import { cn } from "@/lib/utils"
import { useOrderStatsQuery } from "@/shared/queries/order.query"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

interface FlowStatStripProps {
  counts: FlowStageCounts
  activeStatId: FlowStatId | null
  onSelect: (statId: FlowStatId) => void
}

export function FlowStatStrip({
  counts,
  activeStatId,
  onSelect,
}: FlowStatStripProps) {
  const { t } = useTranslation("flow")
  const locale = useLocaleStore((state) => state.locale)
  const { data: orderStats } = useOrderStatsQuery()
  const orders = orderStats?.totalOrders ?? 0
  const revenue = orderStats?.totalRevenue ?? 0

  const items = [
    {
      id: "sets" as const,
      label: t("stats.sets"),
      hint: t("stats.sets_hint"),
      value: formatNumber(counts.import, locale),
      icon: FileInput,
      tone: undefined,
    },
    {
      id: "review" as const,
      label: t("stats.review"),
      hint: t("stats.review_hint"),
      value: formatNumber(counts.matchErrors, locale),
      icon: AlertTriangle,
      tone: counts.matchErrors > 0 ? "warn" : undefined,
    },
    {
      id: "ready" as const,
      label: t("stats.ready"),
      hint: t("stats.ready_hint"),
      value: formatNumber(counts.voucherReady, locale),
      icon: Sparkles,
      tone: undefined,
    },
    {
      id: "vouchers" as const,
      label: t("stats.vouchers"),
      hint: t("stats.vouchers_hint"),
      value: formatNumber(counts.vouchers, locale),
      icon: Receipt,
      tone: undefined,
    },
    {
      id: "export" as const,
      label: t("stats.export"),
      hint: t("stats.export_hint"),
      value: formatNumber(counts.export, locale),
      icon: FileOutput,
      tone: undefined,
    },
    {
      id: "orders" as const,
      label: t("stats.orders"),
      hint: t("stats.orders_hint"),
      value: formatNumber(orders, locale),
      icon: ClipboardList,
      tone: undefined,
    },
    {
      id: "revenue" as const,
      label: t("stats.revenue"),
      hint: t("stats.revenue_hint"),
      value: formatCurrency(revenue, locale, "THB"),
      icon: HandCoins,
      tone: undefined,
    },
  ]

  return (
    <section className="flow-stats" aria-label={t("stats.label")}>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeStatId === item.id
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flow-stat",
              isActive && "flow-stat--active",
              item.tone === "warn" && "flow-stat--warn"
            )}
            aria-pressed={isActive}
            onClick={() => onSelect(item.id)}
          >
            <span className="flow-stat__top">
              <span className="flow-stat__label">{item.label}</span>
              <Icon className="size-3.5 shrink-0" aria-hidden />
            </span>
            <strong className="flow-stat__value">{item.value}</strong>
            <span className="flow-stat__hint">{item.hint}</span>
          </button>
        )
      })}
    </section>
  )
}
