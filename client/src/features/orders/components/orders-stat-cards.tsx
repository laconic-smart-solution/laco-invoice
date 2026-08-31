import { ClipboardList, HandCoins, Receipt, Megaphone } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import type { OrderStats } from "@/shared/services/order.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

interface OrdersStatCardsProps {
  stats: OrderStats
}

export function OrdersStatCards({ stats }: OrdersStatCardsProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title={t("stats.total_orders")}
        value={t("stats.total_orders_value", {
          count: formatNumber(stats.totalOrders, locale),
        })}
        icon={ClipboardList}
        iconWrapperClassName="bg-info/10 text-info"
      />
      <StatCard
        title={t("stats.total_revenue")}
        value={formatCurrency(stats.totalRevenue, locale, "THB")}
        icon={HandCoins}
        iconWrapperClassName="bg-success/10 text-success"
      />
      <StatCard
        title={t("stats.total_fees")}
        value={formatCurrency(stats.totalFees, locale, "THB")}
        icon={Receipt}
        iconWrapperClassName="bg-destructive/10 text-destructive"
      />
      <StatCard
        title={t("stats.total_ads_fee", "Total Ads Fee")}
        value={formatCurrency(stats.totalAdsFee, locale, "THB")}
        icon={Megaphone}
        iconWrapperClassName="bg-warning/10 text-warning"
      />
    </div>
  )
}
