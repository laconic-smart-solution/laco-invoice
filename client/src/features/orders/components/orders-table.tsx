import type { ColumnDef } from "@tanstack/react-table"
import { RefreshCw, Store } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { DataTableRowActions } from "@/components/common/data-table/data-table-row-actions"
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar"
import {
  useDataTable,
  type RowSelectionState,
} from "@/components/common/data-table/use-data-table"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { Order, OrderSyncStatus } from "@/features/orders/types/order"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatDate } from "@/util/format"

const SYNC_STATUS_BADGE: Record<OrderSyncStatus, StatusBadgeVariant> = {
  synced: "synced",
  pending: "pending",
  failed: "failed",
}

interface OrderRowActionProps {
  order: Order
  onGenerate: (order: Order) => void
}

function OrderRowAction({ order, onGenerate }: OrderRowActionProps) {
  const { t } = useTranslation("orders")

  if (
    order.syncStatus !== "synced" &&
    order.syncStatus !== "pending" &&
    order.syncStatus !== "failed"
  ) {
    return null
  }

  return (
    <DataTableRowActions>
      {order.syncStatus === "synced" ? (
        <DropdownMenuItem onSelect={() => undefined}>
          {t("table.actions.view_invoice")}
        </DropdownMenuItem>
      ) : null}
      {order.syncStatus === "pending" ? (
        <DropdownMenuItem onSelect={() => onGenerate(order)}>
          {t("table.actions.generate")}
        </DropdownMenuItem>
      ) : null}
      {order.syncStatus === "failed" ? (
        <DropdownMenuItem variant="destructive" onSelect={() => undefined}>
          <RefreshCw aria-hidden />
          {t("table.actions.retry")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  )
}

interface OrdersTableProps {
  orders: Order[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  start: number
  end: number
  canGoPrev: boolean
  canGoNext: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  isLoading?: boolean
}

export function OrdersTable({
  orders,
  totalCount,
  page,
  limit,
  totalPages,
  start,
  end,
  canGoPrev,
  canGoNext,
  onPageChange,
  onLimitChange,
  isLoading = false,
}: OrdersTableProps) {
  const { t } = useTranslation("orders")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [orderToGenerate, setOrderToGenerate] = useState<Order | null>(null)

  const handleGenerateRequest = useCallback((order: Order) => {
    setOrderToGenerate(order)
  }, [])

  const handleConfirmGenerate = useCallback(() => {
    if (!orderToGenerate) {
      return
    }

    // TODO: wire invoice generation mutation
    setOrderToGenerate(null)
  }, [orderToGenerate])

  const handleRowClick = useCallback(
    (order: Order) => {
      void navigate(ROUTES.dashboard.orderDetail(order.id))
    },
    [navigate]
  )

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "orderId",
        header: t("table.columns.order_id"),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "orderDate",
        header: t("table.columns.order_date"),
        cell: ({ getValue }) => {
          const value = getValue<string>()
          if (!value) {
            return "—"
          }
          const parsed = new Date(value)
          if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 1971) {
            return "—"
          }
          return formatDate(value, locale)
        },
      },
      {
        accessorKey: "storeName",
        header: t("table.columns.store"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center bg-foreground text-background">
              <Store className="size-3.5" aria-hidden />
            </span>
            <span>{row.original.storeName}</span>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: t("table.columns.customer"),
        cell: ({ row }) => {
          const phone = row.original.customerPhone?.trim()
          return (
            <div className="min-w-[140px]">
              <p className="font-medium text-foreground">{row.original.customer}</p>
              {phone ? (
                <p className="text-xs text-muted-foreground">{phone}</p>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: "totalAmount",
        header: t("table.columns.total_amount"),
        cell: ({ row }) =>
          formatCurrency(row.original.totalAmount, locale, row.original.currency),
      },
      {
        accessorKey: "syncStatus",
        header: t("table.columns.sync_status"),
        cell: ({ getValue }) => {
          const status = getValue<OrderSyncStatus>()
          return (
            <StatusBadge
              status={SYNC_STATUS_BADGE[status]}
              label={t(`sync_status.${status}`).toUpperCase()}
              showDot
            />
          )
        },
      },
      {
        id: "action",
        header: t("table.columns.action"),
        cell: ({ row }) => (
          <OrderRowAction order={row.original} onGenerate={handleGenerateRequest} />
        ),
      },
    ],
    [handleGenerateRequest, locale, t]
  )

  const table = useDataTable({
    data: orders,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    selectColumnLabels: {
      selectAll: t("table.select_all"),
      selectRow: t("table.select_row"),
    },
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <ConfirmDialog
        open={orderToGenerate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOrderToGenerate(null)
          }
        }}
        title={t("confirm.generate.title")}
        description={
          orderToGenerate
            ? t("confirm.generate.description", {
                orderId: orderToGenerate.orderId,
              })
            : undefined
        }
        confirmLabel={t("table.actions.generate")}
        onConfirm={handleConfirmGenerate}
      />

      <DataTableToolbar
        table={table}
        selectedLabel={(count) => t("table.selected_count", { count })}
        bulkActionLabel={t("table.bulk_generate")}
        onBulkAction={() => undefined}
      />

      <div className="overflow-x-auto">
        <DataTable
          table={table}
          emptyMessage={t("table.empty")}
          isLoading={isLoading}
          skeletonRowCount={limit}
          onRowClick={handleRowClick}
        />
      </div>

      <DataTableFooter
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        start={start}
        end={end}
        limit={limit}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        showingLabel={(rangeStart, rangeEnd, total) =>
          t("table.showing", { start: rangeStart, end: rangeEnd, total })
        }
      />
    </section>
  )
}
