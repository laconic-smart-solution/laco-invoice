import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table"
import { Store } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header"
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
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import type { Order, OrderSyncStatus } from "@/features/orders/types/order"
import {
  getInvoiceErrorMessage,
  useGenerateInvoiceMutation,
} from "@/shared/queries/invoice.query"
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
  const navigate = useNavigate()

  if (order.invoiceId) {
    return (
      <DataTableRowActions>
        <DropdownMenuItem
          onSelect={() => {
            void navigate(ROUTES.dashboard.invoiceDetail(order.invoiceId as string))
          }}
        >
          {t("table.actions.view_invoice")}
        </DropdownMenuItem>
      </DataTableRowActions>
    )
  }

  return (
    <DataTableRowActions>
      <DropdownMenuItem onSelect={() => onGenerate(order)}>
        {t("table.actions.generate")}
      </DropdownMenuItem>
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
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
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
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
}: OrdersTableProps) {
  const { t } = useTranslation("orders")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [orderToGenerate, setOrderToGenerate] = useState<Order | null>(null)
  const generateMutation = useGenerateInvoiceMutation()

  const handleGenerateRequest = useCallback((order: Order) => {
    setOrderToGenerate(order)
  }, [])

  const handleConfirmGenerate = useCallback(async () => {
    if (!orderToGenerate) {
      return
    }
    const orderId = Number.parseInt(orderToGenerate.id, 10)
    if (!Number.isFinite(orderId)) {
      setOrderToGenerate(null)
      return
    }
    const invoice = await generateMutation.mutateAsync(orderId)
    setOrderToGenerate(null)
    void navigate(ROUTES.dashboard.invoiceDetail(String(invoice.id)))
  }, [generateMutation, navigate, orderToGenerate])

  const generateError =
    generateMutation.isError && generateMutation.error
      ? getInvoiceErrorMessage(
          generateMutation.error,
          t("errors.generate_invoice_failed")
        )
      : null

  const handleRowClick = useCallback(
    (order: Order) => {
      void navigate(ROUTES.dashboard.orderDetail(order.id))
    },
    [navigate]
  )

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      onSortingChange(next)
    },
    [onSortingChange, sorting]
  )

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      const next =
        typeof updater === "function" ? updater(columnFilters) : updater
      onColumnFiltersChange(next)
    },
    [columnFilters, onColumnFiltersChange]
  )

  const columnLabels = useMemo(
    () => ({
      orderId: t("table.columns.order_id"),
      orderDate: t("table.columns.order_date"),
      storeName: t("table.columns.store"),
      customer: t("table.columns.customer"),
      totalAmount: t("table.columns.total_amount"),
      syncStatus: t("table.columns.sync_status"),
    }),
    [t]
  )

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "orderId",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.order_id")}
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "orderDate",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.order_date")}
            enableSearch={false}
          />
        ),
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
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.store")}
            enableSearch={false}
          />
        ),
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
        id: "customer",
        accessorFn: (row) =>
          `${row.customer} ${row.customerPhone?.trim() ?? ""}`.trim(),
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.customer")}
            enableSearch={false}
          />
        ),
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
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.total_amount")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) =>
          formatCurrency(row.original.totalAmount, locale, row.original.currency),
      },
      {
        accessorKey: "syncStatus",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.sync_status")}
            enableSearch={false}
          />
        ),
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
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
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
    manualSorting: true,
    manualFiltering: true,
    selectColumnLabels: {
      selectAll: t("table.select_all"),
      selectRow: t("table.select_row"),
    },
    state: { rowSelection, sorting, columnFilters },
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <AuthFormError message={generateError} />
      <ConfirmDialog
        open={orderToGenerate !== null}
        onOpenChange={(open) => {
          if (!open && !generateMutation.isPending) {
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
        isLoading={generateMutation.isPending}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <DataTableToolbar
          table={table}
          selectedLabel={(count) => t("table.selected_count", { count })}
          bulkActionLabel={t("table.bulk_generate")}
          onBulkAction={() => undefined}
          className="border-b-0"
        />
        <DataTableColumnControls
          table={table}
          columnLabels={columnLabels}
          className="px-4 py-3"
        />
      </div>

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
