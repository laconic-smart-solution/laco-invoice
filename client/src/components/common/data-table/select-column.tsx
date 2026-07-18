import type { ColumnDef } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"

interface SelectColumnLabels {
  selectAll: string
  selectRow: string
}

export function createSelectColumn<TData>(
  labels: SelectColumnLabels
): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <div onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={labels.selectAll}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={labels.selectRow}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
  }
}
