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

import { StatCard } from "@/components/common/stat-card"
import { classicPanelPath } from "@/features/classic-spa/util/classic-route"
import { useUsersPageQuery } from "@/shared/queries/admin-user.query"
import { useCustomersPageQuery } from "@/shared/queries/customer.query"
import { useMarketplaceProductsPageQuery } from "@/shared/queries/marketplace-product.query"
import { useOrderStatsQuery } from "@/shared/queries/order.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import { useAuthStore } from "@/shared/stores/auth-store"
import { useClassicWorkspaceStore } from "@/shared/stores/classic-workspace-store"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

const COUNT_REQUEST = {
  pageNumber: 1,
  pageSize: 1,
} as const

export function ClassicOverviewPanel() {
  const { t } = useTranslation("classic")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")
  const setPanel = useClassicWorkspaceStore((state) => state.setPanel)

  const { data: orderStats } = useOrderStatsQuery()
  const { data: storesPage } = useStoresPageQuery(COUNT_REQUEST)
  const { data: productsPage } = useMarketplaceProductsPageQuery(COUNT_REQUEST)
  const { data: customersPage } = useCustomersPageQuery(COUNT_REQUEST)
  const { data: usersPage } = useUsersPageQuery(COUNT_REQUEST, isAdmin)

  const openPanel = (
    panel: Parameters<typeof setPanel>[0],
    filter?: Parameters<typeof setPanel>[1]
  ) => {
    setPanel(panel, filter)
    void navigate(classicPanelPath(panel), { replace: true })
  }

  const orders = orderStats?.totalOrders ?? 0
  const revenue = orderStats?.totalRevenue ?? 0
  const stores = storesPage?.meta?.totalElements ?? 0
  const products = productsPage?.meta?.totalElements ?? 0
  const customers = customersPage?.meta?.totalElements ?? 0
  const users = usersPage?.meta?.totalElements ?? 0

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {t("overview.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("overview.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title={t("overview.stats.orders")}
          value={formatNumber(orders, locale)}
          icon={ClipboardList}
          iconWrapperClassName="bg-info/10 text-info"
          footer={t("overview.hint_click")}
          onClick={() => openPanel("orders")}
        />
        <StatCard
          title={t("overview.stats.revenue", { defaultValue: "Total Revenue" })}
          value={formatCurrency(revenue, locale, "THB")}
          icon={HandCoins}
          iconWrapperClassName="bg-success/10 text-success"
          footer={t("overview.hint_click")}
          onClick={() => openPanel("orders")}
        />
        <StatCard
          title={t("overview.stats.stores")}
          value={formatNumber(stores, locale)}
          icon={Store}
          footer={t("overview.hint_click")}
          onClick={() => openPanel("stores")}
        />
        <StatCard
          title={t("overview.stats.products")}
          value={formatNumber(products, locale)}
          icon={Package}
          footer={t("overview.hint_click")}
          onClick={() => openPanel("products")}
        />
        <StatCard
          title={t("overview.stats.customers")}
          value={formatNumber(customers, locale)}
          icon={Users}
          footer={t("overview.hint_click")}
          onClick={() => openPanel("customers")}
        />
        {isAdmin ? (
          <StatCard
            title={t("overview.stats.users")}
            value={formatNumber(users, locale)}
            icon={UserCog}
            iconWrapperClassName="bg-info/10 text-info"
            footer={t("overview.hint_click")}
            onClick={() => openPanel("users")}
          />
        ) : null}
      </div>
    </div>
  )
}
