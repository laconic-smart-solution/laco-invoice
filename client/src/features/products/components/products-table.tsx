import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"

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
import type { DataTableSelection } from "@/components/common/data-table/types"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ProductErpStatus, ProductTableRow } from "@/features/products/types/product"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

const ERP_STATUS_BADGE: Record<ProductErpStatus, StatusBadgeVariant> = {
  synced: "synced",
  unmapped: "unmapped",
}

interface ProductRowActionProps {
  product: ProductTableRow
}

function ProductRowAction({ product }: ProductRowActionProps) {
  const { t } = useTranslation("products")

  return (
    <DataTableRowActions>
      <DropdownMenuItem asChild>
        <Link to={ROUTES.dashboard.productDetail(product.id)}>
          {t("table.actions.view_details")}
        </Link>
      </DropdownMenuItem>
      {product.erpStatus === "unmapped" ? (
        <DropdownMenuItem onSelect={() => undefined}>
          {t("table.actions.map_to_erp")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  )
}

interface ProductsTableProps {
  products: ProductTableRow[]
  isLoading?: boolean
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
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
  onSelectionChange?: (selection: DataTableSelection) => void
}

export function ProductsTable({
  products,
  isLoading = false,
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
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  onSelectionChange,
}: ProductsTableProps) {
  const { t } = useTranslation("products")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false)

  const pageRowIdsKey = useMemo(
    () => products.map((product) => product.id).join(","),
    [products]
  )

  useEffect(() => {
    setRowSelection({})
    setIsAllMatchingSelected(false)
  }, [totalCount])

  useEffect(() => {
    if (!isAllMatchingSelected || products.length === 0) {
      return
    }
    const next: RowSelectionState = {}
    for (const product of products) {
      next[String(product.id)] = true
    }
    setRowSelection(next)
  }, [isAllMatchingSelected, pageRowIdsKey, products])

  const handleRowClick = useCallback(
    (product: ProductTableRow) => {
      void navigate(ROUTES.dashboard.productDetail(product.id))
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
      store_marketplace: t("table.columns.store_marketplace"),
      product_sku: t("table.columns.product_sku"),
      name: t("table.columns.name"),
      price: t("table.columns.price"),
      erpStatus: t("table.columns.erp_status"),
    }),
    [t]
  )

  const columns = useMemo<ColumnDef<ProductTableRow>[]>(
    () => [
      {
        id: "store_marketplace",
        accessorFn: (row) => `${row.storeName} ${row.marketplaceName}`,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.store_marketplace")}
          />
        ),
        cell: ({ row }) => (
          <div className="min-w-[160px] space-y-0.5">
            <p className="text-sm text-foreground">{row.original.storeName}</p>
            <p className="text-xs text-muted-foreground">{row.original.marketplaceName}</p>
          </div>
        ),
      },
      {
        id: "product_sku",
        accessorFn: (row) => `${row.externalProductId} ${row.sku ?? ""}`,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.product_sku")}
          />
        ),
        cell: ({ row }) => (
          <div className="min-w-[180px] space-y-1.5">
            <p className="text-sm text-foreground">
              {t("table.id_label", { id: row.original.externalProductId })}
            </p>
            {row.original.sku ? (
              <span className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {row.original.sku}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.name")}
          />
        ),
        cell: ({ getValue }) => {
          const name = getValue<string>()

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block max-w-[220px] truncate font-medium text-foreground">
                  {name}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p className="whitespace-normal break-words">{name}</p>
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: "price",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.price")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => {
          const amount = Number.parseFloat(row.original.price)
          const currency = row.original.currency || "USD"
          if (!Number.isFinite(amount)) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <span className="font-medium text-foreground">
              {formatCurrency(amount, locale, currency)}
            </span>
          )
        },
      },
      {
        accessorKey: "erpStatus",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.erp_status")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => {
          const status = getValue<ProductErpStatus>()
          return (
            <StatusBadge
              status={ERP_STATUS_BADGE[status]}
              label={t(`erp_status.${status}`).toUpperCase()}
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
        cell: ({ row }) => <ProductRowAction product={row.original} />,
      },
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: products,
    columns,
    getRowId: (row) => String(row.id),
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
    const pageRowCount = products.length
    onSelectionChange({
      ids,
      isAllPageSelected: pageRowCount > 0 && ids.length === pageRowCount,
      isAllMatchingSelected,
    })
  }, [isAllMatchingSelected, onSelectionChange, products.length, rowSelection])

  const toolbarSelectedCount = isAllMatchingSelected
    ? totalCount
    : Object.keys(rowSelection).filter((id) => rowSelection[id]).length

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <DataTableToolbar
          table={table}
          selectedLabel={(count) => t("table.selected_count", { count })}
          selectedCount={toolbarSelectedCount}
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
