import { DashboardHeader } from "@/features/dashboard/components/dashboard-header"
import { DashboardStatCards } from "@/features/dashboard/components/dashboard-stat-cards"

export function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeader />
      <DashboardStatCards />
    </div>
  )
}
