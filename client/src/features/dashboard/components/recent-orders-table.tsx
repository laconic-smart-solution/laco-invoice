import type { ColumnDef } from "@tanstack/react-table"
import { Download, History, Pencil, RefreshCw } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTableCard } from "@/components/common/data-table/data-table-card"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { MOCK_RECENT_ORDERS } from "@/features/dashboard/data/mock-dashboard"
import type { OrderStatus, RecentOrder } from "@/features/dashboard/types/dashboard"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

interface OrderRowActionProps {
  order: RecentOrder
}

function OrderRowAction({ order }: OrderRowActionProps) {
  const { t } = useTranslation("dashboard")

  switch (order.status) {
    case "synced":
      return (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("recent_orders.actions.download")}
        >
          <Download />
        </Button>
      )
    case "pending":
      return (
        <Button size="xs" className="uppercase">
          {t("recent_orders.actions.generate")}
        </Button>
      )
    case "error":
      return (
        <Button variant="link" size="sm" className="h-auto p-0 text-destructive uppercase">
          <RefreshCw data-icon="inline-start" />
          {t("recent_orders.actions.retry_sync")}
        </Button>
      )
    case "draft":
      return (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("recent_orders.actions.edit")}
        >
          <Pencil />
        </Button>
      )
    default:
      return null
  }
}

export function RecentOrdersTable() {
  const { t } = useTranslation("dashboard")
  const locale = useLocaleStore((state) => state.locale)

  const columns = useMemo<ColumnDef<RecentOrder>[]>(
    () => [
      {
        accessorKey: "orderId",
        header: t("recent_orders.columns.order_id"),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "customer",
        header: t("recent_orders.columns.customer"),
      },
      {
        accessorKey: "amount",
        header: t("recent_orders.columns.amount"),
        cell: ({ getValue }) => formatCurrency(getValue<number>(), locale),
      },
      {
        accessorKey: "status",
        header: t("recent_orders.columns.status"),
        cell: ({ getValue }) => {
          const status = getValue<OrderStatus>()
          return (
            <StatusBadge
              status={status}
              label={t(`order_status.${status}`).toUpperCase()}
            />
          )
        },
      },
      {
        id: "action",
        header: t("recent_orders.columns.action"),
        cell: ({ row }) => <OrderRowAction order={row.original} />,
      },
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: MOCK_RECENT_ORDERS,
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <DataTableCard
      title={t("recent_orders.title")}
      icon={History}
      headerAction={
        <Link
          to={ROUTES.dashboard.orders}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          {t("recent_orders.view_all")}
        </Link>
      }
      table={table}
      emptyMessage={t("recent_orders.empty")}
    />
  )
}
