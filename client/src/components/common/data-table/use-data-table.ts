import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type TableOptions,
} from "@tanstack/react-table"
import { useMemo } from "react"

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
}

export function useDataTable<TData>({
  columns,
  data,
  enableRowSelection = false,
  selectColumnLabels,
  getRowId,
  state,
  onRowSelectionChange,
  ...options
}: UseDataTableOptions<TData>) {
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
    enableRowSelection,
    getRowId,
    state,
    onRowSelectionChange,
    ...options,
  })
}

export type { OnChangeFn, RowSelectionState }
