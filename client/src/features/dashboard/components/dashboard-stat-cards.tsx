import {
  ClipboardList,
  HandCoins,
  Package,
  Store,
  UserCog,
  Users,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { StatCard } from "@/components/common/stat-card"
import { useUsersPageQuery } from "@/shared/queries/admin-user.query"
import { useCustomersPageQuery } from "@/shared/queries/customer.query"
import { useMarketplaceProductsPageQuery } from "@/shared/queries/marketplace-product.query"
import { useOrderStatsQuery } from "@/shared/queries/order.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import { useAuthStore } from "@/shared/stores/auth-store"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

const COUNT_REQUEST = {
  pageNumber: 1,
  pageSize: 1,
} as const

/** Hongta-style clickable control-tower stats — live counts, navigate to lists. */
export function DashboardStatCards() {
  const { t } = useTranslation("dashboard")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")

  const { data: orderStats } = useOrderStatsQuery()
  const { data: storesPage } = useStoresPageQuery(COUNT_REQUEST)
  const { data: productsPage } = useMarketplaceProductsPageQuery(COUNT_REQUEST)
  const { data: customersPage } = useCustomersPageQuery(COUNT_REQUEST)
  const { data: usersPage } = useUsersPageQuery(COUNT_REQUEST, isAdmin)

  const orders = orderStats?.totalOrders ?? 0
  const revenue = orderStats?.totalRevenue ?? 0
  const stores = storesPage?.meta?.totalElements ?? 0
  const products = productsPage?.meta?.totalElements ?? 0
  const customers = customersPage?.meta?.totalElements ?? 0
  const users = usersPage?.meta?.totalElements ?? 0

  const hint = t("stats.hint_click")

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        title={t("stats.total_orders")}
        value={formatNumber(orders, locale)}
        icon={ClipboardList}
        iconWrapperClassName="bg-info/10 text-info"
        footer={hint}
        onClick={() => void navigate(ROUTES.dashboard.orders)}
      />

      <StatCard
        title={t("stats.total_revenue")}
        value={formatCurrency(revenue, locale, "THB")}
        icon={HandCoins}
        iconWrapperClassName="bg-success/10 text-success"
        footer={hint}
        onClick={() => void navigate(ROUTES.dashboard.orders)}
      />

      <StatCard
        title={t("stats.stores")}
        value={formatNumber(stores, locale)}
        icon={Store}
        footer={hint}
        onClick={() => void navigate(ROUTES.dashboard.stores)}
      />

      <StatCard
        title={t("stats.products")}
        value={formatNumber(products, locale)}
        icon={Package}
        footer={hint}
        onClick={() => void navigate(ROUTES.dashboard.products)}
      />

      <StatCard
        title={t("stats.customers")}
        value={formatNumber(customers, locale)}
        icon={Users}
        footer={hint}
        onClick={() => void navigate(ROUTES.dashboard.customers)}
      />

      {isAdmin ? (
        <StatCard
          title={t("stats.users")}
          value={formatNumber(users, locale)}
          icon={UserCog}
          iconWrapperClassName="bg-info/10 text-info"
          footer={hint}
          onClick={() => void navigate(ROUTES.dashboard.users)}
        />
      ) : null}
    </div>
  )
}
