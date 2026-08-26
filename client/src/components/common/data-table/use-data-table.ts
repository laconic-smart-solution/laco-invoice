import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type VisibilityState,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"

import { createSelectColumn } from "@/components/common/data-table/select-column"

interface SelectColumnLabels {
  selectAll: string
  selectRow: string
}

interface UseDataTableOptions<TData>
  extends Omit<TableOptions<TData>, "columns" | "data" | "getCoreRowModel"> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  enableRowSelection?: boolean
  selectColumnLabels?: SelectColumnLabels
  /** When true, sorting is handled by the server; TanStack will not re-sort rows. */
  manualSorting?: boolean
  /** When true, filtering is handled by the server; TanStack will not filter rows. */
  manualFiltering?: boolean
}

export function useDataTable<TData>({
  columns,
  data,
  enableRowSelection = false,
  selectColumnLabels,
  getRowId,
  state,
  onRowSelectionChange,
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  manualSorting = false,
  manualFiltering = false,
  ...options
}: UseDataTableOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const resolvedColumns = useMemo(() => {
    if (!enableRowSelection) {
      return columns
    }

    const labels = selectColumnLabels ?? {
      selectAll: "Select all",
      selectRow: "Select row",
    }

    return [createSelectColumn<TData>(labels), ...columns]
  }, [columns, enableRowSelection, selectColumnLabels])

  return useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    ...(manualSorting ? {} : { getSortedRowModel: getSortedRowModel() }),
    ...(manualFiltering ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    enableRowSelection,
    getRowId,
    manualSorting,
    manualFiltering,
    onRowSelectionChange,
    onSortingChange: onSortingChange ?? setSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setColumnFilters,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...state,
    },
    ...options,
  })
}

export type {
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  VisibilityState,
}
