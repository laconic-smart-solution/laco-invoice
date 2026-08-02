import { ClipboardList, FileWarning, Percent } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import type { OrderStats } from "@/shared/services/order.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatNumber } from "@/util/format"

interface OrdersStatCardsProps {
  stats: OrderStats
}

export function OrdersStatCards({ stats }: OrdersStatCardsProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <StatCard
        title={t("stats.invoice_coverage")}
        value={`${stats.invoiceCoveragePercent.toFixed(1)}%`}
        icon={Percent}
        iconWrapperClassName="bg-success/10 text-success"
      />
      <StatCard
        title={t("stats.awaiting_invoice")}
        value={t("stats.awaiting_invoice_value", {
          count: formatNumber(stats.awaitingInvoice, locale),
        })}
        icon={FileWarning}
        iconWrapperClassName="bg-destructive/10 text-destructive"
      />
      <StatCard
        title={t("stats.total_orders")}
        value={t("stats.total_orders_value", {
          count: formatNumber(stats.totalOrders, locale),
        })}
        icon={ClipboardList}
        iconWrapperClassName="bg-info/10 text-info"
      />
    </div>
  )
}
