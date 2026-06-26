import {
  flexRender,
  type Row,
  type Table,
} from "@tanstack/react-table"

import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface DataTableProps<TData> {
  table: Table<TData>
  emptyMessage?: string
  className?: string
  onRowClick?: (row: TData) => void
}

export function DataTable<TData>({
  table,
  emptyMessage,
  className,
  onRowClick,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows

  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        {emptyMessage ?? "No results."}
      </div>
    )
  }

  const handleRowClick = (row: Row<TData>) => {
    if (!onRowClick) {
      return
    }

    onRowClick(row.original)
  }

  return (
    <UiTable className={className}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className="h-11 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className={cn(
              "border-b border-border/80",
              onRowClick && "cursor-pointer hover:bg-muted/50"
            )}
            data-state={row.getIsSelected() ? "selected" : undefined}
            onClick={() => handleRowClick(row)}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="px-4 py-3.5 text-sm">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </UiTable>
  )
}
