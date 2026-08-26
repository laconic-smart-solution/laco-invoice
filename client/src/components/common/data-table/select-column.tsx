import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"

import type { DataTableMeta } from "@/components/common/data-table/types"
import { Checkbox } from "@/components/ui/checkbox"

interface SelectColumnLabels {
  selectAll: string
  selectRow: string
}

function getSelectAllMatching(meta: unknown): DataTableMeta["selectAllMatching"] {
  if (!meta || typeof meta !== "object") {
    return undefined
  }
  return (meta as DataTableMeta).selectAllMatching
}

export function createSelectColumn<TData>(
  labels: SelectColumnLabels
): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => {
      const matching = getSelectAllMatching(table.options.meta)
      const allPageSelected = table.getIsAllPageRowsSelected()
      const somePageSelected = table.getIsSomePageRowsSelected()

      const checked = matching?.enabled
        ? matching.isSelected ||
          allPageSelected ||
          (somePageSelected ? "indeterminate" : false)
        : allPageSelected || (somePageSelected ? "indeterminate" : false)

      return (
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => {
              const selected = !!value
              if (matching?.enabled) {
                matching.onChange(selected)
                table.toggleAllPageRowsSelected(selected)
                return
              }
              table.toggleAllPageRowsSelected(selected)
            }}
            aria-label={labels.selectAll}
          />
        </div>
      )
    },
    cell: ({ row, table }) => {
      const matching = getSelectAllMatching(table.options.meta)
      const checked = matching?.isSelected ? true : row.getIsSelected()

      return (
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => {
              const selected = !!value

              if (matching?.isSelected && !selected) {
                matching.onChange(false)
                const next: RowSelectionState = {}
                for (const pageRow of table.getRowModel().rows) {
                  if (pageRow.id !== row.id) {
                    next[pageRow.id] = true
                  }
                }
                table.setRowSelection(next)
                return
              }

              row.toggleSelected(selected)
            }}
            aria-label={labels.selectRow}
          />
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
  }
}
