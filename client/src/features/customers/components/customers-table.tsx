import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar"
import {
  useDataTable,
  type RowSelectionState,
} from "@/components/common/data-table/use-data-table"
import type { DataTableSelection } from "@/components/common/data-table/types"
import type { Customer } from "@/features/customers/types/customer"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatGenderLabel(
  gender: Customer["gender"],
  t: (key: string) => string
): string {
  if (gender === "male" || gender === "female") {
    return t(`table.gender.${gender}`)
  }
  return gender?.trim() ? gender : "—"
}

interface CustomersTableProps {
  customers: Customer[]
  isAdmin?: boolean
  totalCount: number
  page: number
  limit: number
  totalPages: number
  start: number
  end: number
  canGoPrev: boolean
  canGoNext: boolean
  isLoading?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
  onSelectionChange?: (selection: DataTableSelection) => void
}

export function CustomersTable({
  customers,
  isAdmin = false,
  totalCount,
  page,
  limit,
  totalPages,
  start,
  end,
  canGoPrev,
  canGoNext,
  isLoading = false,
  onPageChange,
  onLimitChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  onSelectionChange,
}: CustomersTableProps) {
  const { t } = useTranslation("customers")
  const navigate = useNavigate()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false)

  const pageRowIdsKey = useMemo(
    () => customers.map((customer) => customer.id).join(","),
    [customers]
  )

  useEffect(() => {
    setRowSelection({})
    setIsAllMatchingSelected(false)
  }, [totalCount])

  useEffect(() => {
    if (!isAllMatchingSelected || customers.length === 0) {
      return
    }
    const next: RowSelectionState = {}
    for (const customer of customers) {
      next[String(customer.id)] = true
    }
    setRowSelection(next)
  }, [customers, isAllMatchingSelected, pageRowIdsKey])

  const handleRowClick = useCallback(
    (customer: Customer) => {
      navigate(ROUTES.dashboard.customerEdit(String(customer.id)))
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

  const columnLabels = useMemo(() => {
    const labels: Record<string, string> = {
      id: t("table.columns.id"),
      name: t("table.columns.customer_name"),
      email: t("table.columns.email"),
      phone: t("table.columns.phone"),
      gender: t("table.columns.gender"),
      address: t("table.columns.address"),
    }

    if (isAdmin) {
      labels.store = t("table.columns.store")
    }

    return labels
  }, [isAdmin, t])

  const columns = useMemo<ColumnDef<Customer>[]>(() => {
    const baseColumns: ColumnDef<Customer>[] = [
      {
        accessorKey: "id",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.id")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue<number>()}
          </span>
        ),
      },
    ]

    if (isAdmin) {
      baseColumns.push({
        id: "store",
        accessorFn: (row) =>
          `${row.storeName ?? ""} ${row.marketplaceCode ?? ""} ${row.storeId ?? ""}`.trim(),
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.store")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => {
          const customer = row.original
          const storeName = customer.storeName?.trim()
          const marketplaceCode = customer.marketplaceCode?.trim()
          if (storeName && marketplaceCode) {
            return (
              <span className="text-sm text-foreground">
                {storeName} — {marketplaceCode}
              </span>
            )
          }
          if (storeName) {
            return <span className="text-sm text-foreground">{storeName}</span>
          }
          if (marketplaceCode) {
            return <span className="text-sm text-muted-foreground">{marketplaceCode}</span>
          }
          return (
            <span className="font-mono text-xs text-muted-foreground">
              {customer.storeId ?? "—"}
            </span>
          )
        },
      })
    }

    baseColumns.push(
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.customer_name")}
          />
        ),
        cell: ({ row }) => {
          const customer = row.original

          return (
            <div className="flex min-w-[200px] items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(customer.name)}
              </div>
              <p className="font-medium text-foreground">{customer.name}</p>
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.email")}
          />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.phone")}
          />
        ),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "gender",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.gender")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {formatGenderLabel(getValue<Customer["gender"]>(), t)}
          </span>
        ),
      },
      {
        accessorKey: "address",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.address")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => (
          <span className="min-w-[200px] text-muted-foreground">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      }
    )

    return baseColumns
  }, [isAdmin, t])

  const table = useDataTable({
    data: customers,
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
    const pageRowCount = customers.length
    onSelectionChange({
      ids,
      isAllPageSelected: pageRowCount > 0 && ids.length === pageRowCount,
      isAllMatchingSelected,
    })
  }, [customers.length, isAllMatchingSelected, onSelectionChange, rowSelection])

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
