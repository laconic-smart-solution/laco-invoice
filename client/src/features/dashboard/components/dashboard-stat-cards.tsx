import { FileText, ShoppingBag, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Progress } from "@/components/ui/progress"
import { MOCK_DASHBOARD_STATS } from "@/features/dashboard/data/mock-dashboard"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

export function DashboardStatCards() {
  const { t } = useTranslation("dashboard")
  const locale = useLocaleStore((state) => state.locale)
  const stats = MOCK_DASHBOARD_STATS

  const syncPercent = Math.round((stats.syncedOrders / stats.totalOrders) * 100)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatCard
        title={t("stats.total_revenue")}
        value={formatCurrency(stats.totalRevenue, locale)}
        icon={Wallet}
        iconWrapperClassName="bg-destructive/10 text-destructive"
        trend={{
          value: t("stats.revenue_trend", { percent: stats.revenueTrendPercent }),
          isPositive: true,
        }}
        footer={t("stats.last_sync", {
          time: t("common:time.minutes_ago", { count: stats.lastSyncMinutesAgo }),
          count: stats.channelCount,
        })}
      />

      <StatCard
        title={t("stats.total_orders")}
        value={formatNumber(stats.totalOrders, locale)}
        icon={ShoppingBag}
        iconWrapperClassName="bg-info/10 text-info"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status="synced"
              label={t("stats.synced_count", { count: stats.syncedOrders })}
            />
            <StatusBadge
              status="pending"
              label={t("stats.pending_count", { count: stats.pendingOrders })}
            />
          </div>
          <div className="space-y-1.5">
            <Progress value={syncPercent} className="h-1.5" />
            <p className="text-xs font-medium text-info">
              {t("stats.progress_label", { percent: syncPercent })}
            </p>
          </div>
        </div>
      </StatCard>

      <StatCard
        title={t("stats.invoices_issued")}
        value={t("stats.invoices_of_total", {
          issued: formatNumber(stats.invoicesIssued, locale),
          total: formatNumber(stats.totalOrders, locale),
        })}
        icon={FileText}
        iconWrapperClassName="bg-destructive/10 text-destructive"
      >
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            {t("stats.paid_legend", { count: stats.invoicesPaid })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" aria-hidden />
            {t("stats.overdue_legend", { count: stats.invoicesOverdue })}
          </span>
        </div>
      </StatCard>
    </div>
  )
}
