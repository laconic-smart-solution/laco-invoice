import { Activity, AlertCircle, DollarSign, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import type { CustomerStats } from "@/features/customers/types/customer"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

interface CustomersStatCardsProps {
  stats: CustomerStats
}

export function CustomersStatCards({ stats }: CustomersStatCardsProps) {
  const { t } = useTranslation("customers")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title={t("stats.total_customers")}
        value={formatNumber(stats.totalCustomers, locale)}
        icon={Users}
        trend={{
          value: `+${stats.totalCustomersTrendPercent}%`,
          isPositive: true,
        }}
      />
      <StatCard
        title={t("stats.avg_lifetime_value")}
        value={formatCurrency(stats.avgLifetimeValue, locale)}
        icon={DollarSign}
        trend={{
          value: `+${stats.avgLifetimeValueTrendPercent}%`,
          isPositive: true,
        }}
      />
      <StatCard
        title={t("stats.active_this_month")}
        value={formatNumber(stats.activeThisMonth, locale)}
        icon={Activity}
      >
        <span className="text-xs font-medium text-info">{t("stats.stable")}</span>
      </StatCard>
      <StatCard
        title={t("stats.sync_errors")}
        value={formatNumber(stats.syncErrors, locale)}
        icon={AlertCircle}
      >
        <span className="text-xs font-medium text-success">{t("stats.clean")}</span>
      </StatCard>
    </div>
  )
}
