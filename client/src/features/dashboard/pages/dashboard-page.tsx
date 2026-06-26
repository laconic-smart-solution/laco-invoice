import { ActiveMarketplacesCard } from "@/features/dashboard/components/active-marketplaces-card"
import { CashFlowPromoCard } from "@/features/dashboard/components/cash-flow-promo-card"
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header"
import { DashboardStatCards } from "@/features/dashboard/components/dashboard-stat-cards"
import { RecentOrdersTable } from "@/features/dashboard/components/recent-orders-table"

export function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeader />
      <DashboardStatCards />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <RecentOrdersTable />

        <aside className="space-y-6">
          <ActiveMarketplacesCard />
          <CashFlowPromoCard />
        </aside>
      </div>
    </div>
  )
}
