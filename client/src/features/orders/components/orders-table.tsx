import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table"
import { Info, Store } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { DataTableRowActions } from "@/components/common/data-table/data-table-row-actions"
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar"
import type { DataTableSelection } from "@/components/common/data-table/types"
import {
  useDataTable,
  type RowSelectionState,
  type VisibilityState,
} from "@/components/common/data-table/use-data-table"
import { StatusBadge } from "@/components/common/status-badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { OrderHistoryDialog } from "@/features/orders/components/order-history-dialog"
import type {
  Order,
  OrderSourceType,
  OrderSyncStatus,
} from "@/features/orders/types/order"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatDate } from "@/util/format"

const SYNC_STATUS_BADGE: Record<OrderSyncStatus, StatusBadgeVariant> = {
  synced: "synced",
  pending: "pending",
  failed: "failed",
}

const SOURCE_TYPE_BADGE: Record<OrderSourceType, StatusBadgeVariant> = {
  API: "synced",
  IMPORT: "draft",
}

const DEFAULT_HIDDEN_ORDER_COLUMNS: VisibilityState = {
  syncStatus: false,
  sourceType: false,
  totalFees: false,
  totalAdjustments: false,
  tiktokCommissionFee: true,
  transactionFee: true,
  affiliateCommission: true,
  adsFee: true,
  shippingFeeDeduction: true,
}

interface OrderRowActionProps {
  order: Order
  onHistory: (order: Order) => void
}

function OrderRowAction({ order, onHistory }: OrderRowActionProps) {
  const { t } = useTranslation("orders")

  return (
    <DataTableRowActions>
      <DropdownMenuItem onSelect={() => onHistory(order)}>
        {t("table.actions.history")}
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
  onSelectionChange?: (selection: DataTableSelection) => void
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
  onSelectionChange,
}: OrdersTableProps) {
  const { t } = useTranslation("orders")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false)
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_HIDDEN_ORDER_COLUMNS
  )

  const pageRowIdsKey = useMemo(
    () => orders.map((order) => order.id).join(","),
    [orders]
  )

  useEffect(() => {
    setRowSelection({})
    setIsAllMatchingSelected(false)
  }, [totalCount])

  useEffect(() => {
    if (!isAllMatchingSelected || orders.length === 0) {
      return
    }
    const next: RowSelectionState = {}
    for (const order of orders) {
      next[order.id] = true
    }
    setRowSelection(next)
  }, [isAllMatchingSelected, orders, pageRowIdsKey])

  const handleHistoryRequest = useCallback((order: Order) => {
    setHistoryOrder(order)
  }, [])

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
      totalFees: t("table.columns.total_fees"),
      tiktokCommissionFee: t("table.columns.tiktok_commission_fee", "TikTok Commission"),
      transactionFee: t("table.columns.transaction_fee", "Transaction Fee"),
      affiliateCommission: t("table.columns.affiliate_commission", "Affiliate Commission"),
      adsFee: t("table.columns.ads_fee", "Shop Ads Fee"),
      shippingFeeDeduction: t("table.columns.shipping_fee_deduction", "Shipping Fee / Subsidy"),
      totalAdjustments: t("table.columns.total_adjustments"),
      syncStatus: t("table.columns.sync_status"),
      sourceType: t("table.columns.source"),
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
          <span className="font-mono text-xs font-medium text-foreground whitespace-nowrap">
            {getValue<string>()}
          </span>
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
          return (
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {formatDate(value, locale)}
            </span>
          )
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
          <div className="flex items-center gap-1.5 min-w-0 max-w-[200px]">
            <span className="flex size-5 shrink-0 items-center justify-center bg-foreground text-background">
              <Store className="size-3" aria-hidden />
            </span>
            <span className="truncate text-xs font-medium" title={row.original.storeName}>
              {row.original.storeName}
            </span>
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
            <div className="min-w-0 max-w-[150px]">
              <p className="truncate font-medium text-foreground text-xs" title={row.original.customer}>
                {row.original.customer}
              </p>
              {phone ? (
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {phone}
                </p>
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
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
            {formatCurrency(row.original.totalAmount, locale, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "totalFees",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <DataTableColumnHeader
              column={column}
              title={t("table.columns.total_fees")}
              enableSearch={false}
            />
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    aria-label="Information about Total Fees"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="max-w-xs p-3 text-xs leading-relaxed bg-popover text-popover-foreground border border-border shadow-xl rounded-md">
                  <div className="space-y-1.5 text-left font-sans">
                    <p className="font-semibold text-foreground border-b border-border/50 pb-1">
                      Total Platform Deductions & Fees
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total marketplace deductions extracted from the Service fee / Payout report:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                      <li>TikTok Shop Commission & Transaction fees</li>
                      <li>Affiliate commissions & Ads deductions</li>
                      <li>Platform program fees & shipping subsidies</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-muted-foreground whitespace-nowrap">
            {formatCurrency(row.original.totalFees, locale, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "tiktokCommissionFee",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.tiktok_commission_fee", "TikTok Commission")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatCurrency(row.original.tiktokCommissionFee ?? 0, locale, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "transactionFee",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.transaction_fee", "Transaction Fee")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatCurrency(row.original.transactionFee ?? 0, locale, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "affiliateCommission",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.affiliate_commission", "Affiliate Commission")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatCurrency(row.original.affiliateCommission ?? 0, locale, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "adsFee",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.ads_fee", "Shop Ads Fee")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatCurrency(row.original.adsFee ?? 0, locale, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "shippingFeeDeduction",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.shipping_fee_deduction", "Shipping Fee / Subsidy")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatCurrency(row.original.shippingFeeDeduction ?? 0, locale, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "totalAdjustments",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.total_adjustments")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatCurrency(
              row.original.totalAdjustments,
              locale,
              row.original.currency
            )}
          </span>
        ),
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
        accessorKey: "sourceType",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.source")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => {
          const sourceType = getValue<OrderSourceType>()
          return (
            <StatusBadge
              status={SOURCE_TYPE_BADGE[sourceType]}
              label={t(`source_type.${sourceType === "IMPORT" ? "import" : "api"}`).toUpperCase()}
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
          <OrderRowAction
            order={row.original}
            onHistory={handleHistoryRequest}
          />
        ),
      },
    ],
    [handleHistoryRequest, locale, t]
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
    initialState: {
      columnVisibility: DEFAULT_HIDDEN_ORDER_COLUMNS,
    },
    state: { rowSelection, sorting, columnFilters, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      selectAllMatching: {
        enabled: true,
        isSelected: isAllMatchingSelected,
        onChange: setIsAllMatchingSelected,
      },
    },
  })

  useEffect(() => {
    if (!onSelectionChange) {
      return
    }
    const ids = Object.keys(rowSelection).filter((id) => rowSelection[id])
    const pageRowCount = orders.length
    onSelectionChange({
      ids,
      isAllPageSelected: pageRowCount > 0 && ids.length === pageRowCount,
      isAllMatchingSelected,
    })
  }, [isAllMatchingSelected, onSelectionChange, orders.length, rowSelection])

  const toolbarSelectedCount = isAllMatchingSelected
    ? totalCount
    : Object.keys(rowSelection).filter((id) => rowSelection[id]).length

  return (
    <section className="border border-border bg-card shadow-sm">
      <OrderHistoryDialog
        open={historyOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryOrder(null)
          }
        }}
        orderId={
          historyOrder != null ? Number.parseInt(historyOrder.id, 10) || null : null
        }
        externalOrderId={historyOrder?.orderId ?? null}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <DataTableToolbar
          table={table}
          selectedCount={toolbarSelectedCount}
          selectedLabel={(count) => t("table.selected_count", { count })}
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
